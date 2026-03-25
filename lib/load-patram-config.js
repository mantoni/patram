/* eslint-disable max-lines */

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import process from 'node:process';

import { z } from 'zod';

import {
  class_definition_schema,
  mapping_definition_schema,
  parsePatramConfig,
  relation_definition_schema,
} from './patram-config.js';
import { parseWhereClause } from './parse-where-clause.js';
import { getQuerySemanticDiagnostics } from './query-inspection.js';
import { resolvePatramGraphConfig } from './resolve-patram-graph-config.js';
import { DEFAULT_INCLUDE_PATTERNS } from './source-file-defaults.js';

/**
 * Repo config loading.
 *
 * Reads `.patram.json`, applies defaults, and validates repo config and graph
 * schema before command execution.
 *
 * Kind: config
 * Status: active
 * Tracked in: ../docs/plans/v0/source-anchor-dogfooding.md
 * Decided by: ../docs/decisions/single-config-file.md
 * Decided by: ../docs/decisions/optional-config-default-scan.md
 * @patram
 * @see {@link ./resolve-patram-graph-config.js}
 * @see {@link ../docs/decisions/single-config-file.md}
 */

const CONFIG_FILE_NAME = '.patram.json';
const RESERVED_STRUCTURAL_FIELD_NAMES = new Set(['$class', '$id', '$path']);

/**
 * @typedef {object} PatramDiagnostic
 * @property {string} code
 * @property {number} column
 * @property {'error'} level
 * @property {number} line
 * @property {string} message
 * @property {string} path
 */

/**
 * @typedef {z.output<typeof stored_query_schema>} StoredQueryConfig
 */
const stored_query_schema = z
  .object({
    where: z.string().min(1, 'Stored query "where" must not be empty.'),
  })
  .strict();

/**
 * @typedef {z.output<typeof derived_summary_scalar_schema>} DerivedSummaryScalar
 */
const derived_summary_scalar_schema = z.union([
  z.boolean(),
  z.number(),
  z.string(),
  z.null(),
]);

/**
 * @typedef {z.output<typeof derived_summary_count_schema>} DerivedSummaryCountConfig
 */
const derived_summary_count_schema = z
  .object({
    traversal: z
      .string()
      .min(1, 'Derived summary count "traversal" must not be empty.'),
    where: z
      .string()
      .min(1, 'Derived summary count "where" must not be empty.'),
  })
  .strict();

/**
 * @typedef {z.output<typeof derived_summary_select_case_schema>} DerivedSummarySelectCaseConfig
 */
const derived_summary_select_case_schema = z
  .object({
    value: derived_summary_scalar_schema,
    when: z.string().min(1, 'Derived summary select "when" must not be empty.'),
  })
  .strict();

const derived_summary_field_name_schema = z
  .string()
  .regex(
    /^[a-z][a-z0-9_]*$/du,
    'Derived summary field names must use lower_snake_case.',
  );

/**
 * @typedef {z.output<typeof derived_summary_field_schema>} DerivedSummaryFieldConfig
 */
const derived_summary_count_field_schema = z
  .object({
    count: derived_summary_count_schema,
    name: derived_summary_field_name_schema,
  })
  .strict();

const derived_summary_select_field_schema = z
  .object({
    default: derived_summary_scalar_schema,
    name: derived_summary_field_name_schema,
    select: z
      .array(derived_summary_select_case_schema)
      .min(1, 'Derived summary "select" must contain at least one case.'),
  })
  .strict();

const derived_summary_field_schema = z.union([
  derived_summary_count_field_schema,
  derived_summary_select_field_schema,
]);

/**
 * @typedef {z.output<typeof derived_summary_schema>} DerivedSummaryConfig
 */
const derived_summary_schema = z
  .object({
    classes: z
      .array(z.string().min(1))
      .min(1, 'Derived summary "classes" must contain at least one class.'),
    fields: z
      .array(derived_summary_field_schema)
      .min(1, 'Derived summary "fields" must contain at least one field.'),
  })
  .strict()
  .superRefine(validateDerivedSummaryDefinition);

/**
 * @typedef {z.output<typeof field_display_schema>} FieldDisplayConfig
 */
const field_display_schema = z
  .object({
    hidden: z.boolean().optional(),
    order: z.number().optional(),
  })
  .strict();

/**
 * @typedef {z.output<typeof field_query_schema>} FieldQueryConfig
 */
const field_query_schema = z
  .object({
    contains: z.boolean().optional(),
    prefix: z.boolean().optional(),
  })
  .strict();

const field_base_shape = {
  display: field_display_schema.optional(),
  multiple: z.boolean().optional(),
  path_class: z.string().min(1).optional(),
};

/**
 * @typedef {z.output<typeof metadata_field_schema>} MetadataFieldConfig
 */
const metadata_field_schema = z.discriminatedUnion('type', [
  z
    .object({
      ...field_base_shape,
      query: field_query_schema.optional(),
      type: z.literal('string'),
    })
    .strict(),
  z
    .object({
      ...field_base_shape,
      type: z.literal('integer'),
    })
    .strict(),
  z
    .object({
      ...field_base_shape,
      type: z.literal('enum'),
      values: z
        .array(z.string().min(1, 'Field enum values must not be empty.'))
        .min(1, 'Field enum values must contain at least one value.'),
    })
    .strict(),
  z
    .object({
      ...field_base_shape,
      type: z.literal('path'),
    })
    .strict(),
  z
    .object({
      ...field_base_shape,
      type: z.literal('glob'),
    })
    .strict(),
  z
    .object({
      ...field_base_shape,
      type: z.literal('date'),
    })
    .strict(),
  z
    .object({
      ...field_base_shape,
      type: z.literal('date_time'),
    })
    .strict(),
]);

/**
 * @typedef {z.output<typeof class_field_rule_schema>} ClassFieldRuleConfig
 */
const class_field_rule_schema = z
  .object({
    presence: z.enum(['required', 'optional', 'forbidden']),
  })
  .strict();

/**
 * @typedef {z.output<typeof class_schema_schema>} ClassSchemaConfig
 */
const class_schema_schema = z
  .object({
    document_path_class: z.string().min(1).optional(),
    fields: z.record(z.string().min(1), class_field_rule_schema).default({}),
    unknown_fields: z.enum(['ignore', 'error']).optional(),
  })
  .strict();

/**
 * @typedef {z.output<typeof path_class_schema>} PathClassConfig
 */
const path_class_schema = z
  .object({
    prefixes: z
      .array(z.string().min(1, 'Path class prefixes must not be empty.'))
      .min(1, 'Path classes must contain at least one prefix.'),
  })
  .strict();

/**
 * @typedef {z.output<typeof patram_repo_config_schema>} PatramRepoConfig
 */
const patram_repo_config_schema = z
  .object({
    class_schemas: z.record(z.string().min(1), class_schema_schema).optional(),
    classes: z.record(z.string().min(1), class_definition_schema).optional(),
    derived_summaries: z
      .record(z.string().min(1), derived_summary_schema)
      .optional(),
    fields: z.record(z.string().min(1), metadata_field_schema).optional(),
    include: z
      .array(z.string().min(1, 'Include globs must not be empty.'))
      .min(1, 'Include must contain at least one glob.')
      .default(DEFAULT_INCLUDE_PATTERNS),
    mappings: z.record(z.string().min(1), mapping_definition_schema).optional(),
    path_classes: z.record(z.string().min(1), path_class_schema).optional(),
    queries: z.record(z.string().min(1), stored_query_schema).default({}),
    relations: z
      .record(z.string().min(1), relation_definition_schema)
      .optional(),
  })
  .strict()
  .superRefine(validateFieldDefinitionKeys);

/**
 * @typedef {object} LoadPatramConfigResult
 * @property {PatramRepoConfig | null} config
 * @property {string} config_path
 * @property {PatramDiagnostic[]} diagnostics
 */

/**
 * Load and validate the repo Patram config.
 *
 * @param {string} [project_directory]
 * @returns {Promise<LoadPatramConfigResult>}
 */
export async function loadPatramConfig(project_directory = process.cwd()) {
  const config_file_path = resolve(project_directory, CONFIG_FILE_NAME);
  const config_source = await readConfigSource(config_file_path);

  if (config_source === null) {
    return createLoadResult(createDefaultRepoConfig(), []);
  }

  const parse_result = parseConfigJson(config_source);

  if (!parse_result.success) {
    return createLoadResult(null, [parse_result.diagnostic]);
  }

  const config_result = patram_repo_config_schema.safeParse(parse_result.value);

  if (!config_result.success) {
    return createLoadResult(
      null,
      config_result.error.issues.map(createValidationDiagnostic),
    );
  }

  const graph_schema_diagnostics = validateGraphSchema(config_result.data);

  if (graph_schema_diagnostics.length > 0) {
    return createLoadResult(null, graph_schema_diagnostics);
  }

  const normalized_config = normalizeRepoConfig(config_result.data);
  const field_schema_diagnostics = validateFieldSchemaConfig(normalized_config);

  if (field_schema_diagnostics.length > 0) {
    return createLoadResult(null, field_schema_diagnostics);
  }

  const stored_query_diagnostics = validateStoredQueries(normalized_config);

  if (stored_query_diagnostics.length > 0) {
    return createLoadResult(null, stored_query_diagnostics);
  }

  const derived_summary_diagnostics =
    validateDerivedSummaries(normalized_config);

  if (derived_summary_diagnostics.length > 0) {
    return createLoadResult(null, derived_summary_diagnostics);
  }

  return createLoadResult(normalized_config, []);
}

/**
 * @param {string} config_file_path
 * @returns {Promise<string | null>}
 */
async function readConfigSource(config_file_path) {
  try {
    return await readFile(config_file_path, 'utf8');
  } catch (error) {
    if (isMissingFileError(error)) {
      return null;
    }

    throw error;
  }
}

/**
 * @param {string} config_source
 * @returns {{ success: true, value: unknown } | { success: false, diagnostic: PatramDiagnostic }}
 */
function parseConfigJson(config_source) {
  try {
    return {
      success: true,
      value: JSON.parse(config_source),
    };
  } catch (error) {
    if (error instanceof SyntaxError) {
      return {
        diagnostic: createInvalidJsonDiagnostic(config_source, error),
        success: false,
      };
    }

    throw error;
  }
}

/**
 * @param {PatramRepoConfig | null} config
 * @param {PatramDiagnostic[]} diagnostics
 * @returns {LoadPatramConfigResult}
 */
function createLoadResult(config, diagnostics) {
  return {
    config,
    config_path: CONFIG_FILE_NAME,
    diagnostics,
  };
}

/**
 * @param {string} config_source
 * @param {SyntaxError} error
 * @returns {PatramDiagnostic}
 */
function createInvalidJsonDiagnostic(config_source, error) {
  const origin = getJsonSyntaxOrigin(config_source, error.message);

  return {
    code: 'config.invalid_json',
    column: origin.column,
    level: 'error',
    line: origin.line,
    message: 'Invalid JSON syntax.',
    path: CONFIG_FILE_NAME,
  };
}

/**
 * @param {import('zod').core.$ZodIssue} issue
 * @returns {PatramDiagnostic}
 */
function createValidationDiagnostic(issue) {
  const issue_path = formatIssuePath(issue.path);

  if (issue_path) {
    return {
      code: 'config.invalid',
      column: 1,
      level: 'error',
      line: 1,
      message: `Invalid config at "${issue_path}": ${issue.message}`,
      path: CONFIG_FILE_NAME,
    };
  }

  return {
    code: 'config.invalid',
    column: 1,
    level: 'error',
    line: 1,
    message: `Invalid config: ${issue.message}`,
    path: CONFIG_FILE_NAME,
  };
}

/**
 * @param {{ fields?: Record<string, MetadataFieldConfig> }} repo_config
 * @param {import('zod').RefinementCtx} refinement_context
 */
function validateFieldDefinitionKeys(repo_config, refinement_context) {
  for (const field_name of Object.keys(repo_config.fields ?? {})) {
    if (!field_name.startsWith('$')) {
      continue;
    }

    refinement_context.addIssue({
      code: 'custom',
      message: 'Metadata field names must not start with "$".',
      path: ['fields', field_name],
    });
  }
}

/**
 * @param {{ fields: Array<{ name: string }> }} summary_definition
 * @param {import('zod').RefinementCtx} refinement_context
 */
function validateDerivedSummaryDefinition(
  summary_definition,
  refinement_context,
) {
  const seen_field_names = new Set();

  for (const [
    field_index,
    field_definition,
  ] of summary_definition.fields.entries()) {
    if (!seen_field_names.has(field_definition.name)) {
      seen_field_names.add(field_definition.name);
      continue;
    }

    refinement_context.addIssue({
      code: 'custom',
      message: `Duplicate derived summary field "${field_definition.name}".`,
      path: ['fields', field_index, 'name'],
    });
  }
}

/**
 * @param {PatramRepoConfig} repo_config
 * @returns {PatramDiagnostic[]}
 */
function validateGraphSchema(repo_config) {
  if (
    repo_config.classes === undefined &&
    repo_config.mappings === undefined &&
    repo_config.relations === undefined
  ) {
    return [];
  }

  try {
    parsePatramConfig({
      classes: repo_config.classes ?? {},
      mappings: repo_config.mappings ?? {},
      relations: repo_config.relations ?? {},
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return error.issues.map(createValidationDiagnostic);
    }

    throw error;
  }

  return [];
}

/**
 * @param {PatramRepoConfig} repo_config
 * @returns {PatramDiagnostic[]}
 */
function validateFieldSchemaConfig(repo_config) {
  const path_classes = repo_config.path_classes ?? {};
  const classes = repo_config.classes ?? {};
  const fields = repo_config.fields ?? {};
  /** @type {PatramDiagnostic[]} */
  const diagnostics = [];

  collectFieldConfigDiagnostics(diagnostics, path_classes, fields);
  collectClassSchemaConfigDiagnostics(
    diagnostics,
    path_classes,
    classes,
    fields,
    repo_config.class_schemas,
  );

  return diagnostics;
}

/**
 * @param {PatramRepoConfig} repo_config
 * @returns {PatramDiagnostic[]}
 */
function validateStoredQueries(repo_config) {
  /** @type {PatramDiagnostic[]} */
  const diagnostics = [];

  for (const [query_name, stored_query] of Object.entries(
    repo_config.queries,
  )) {
    collectWhereClauseDiagnostics(
      diagnostics,
      repo_config,
      stored_query.where,
      `queries.${query_name}.where`,
    );
  }

  return diagnostics;
}

/**
 * @param {PatramRepoConfig} repo_config
 * @returns {PatramDiagnostic[]}
 */
function validateDerivedSummaries(repo_config) {
  if (!repo_config.derived_summaries) {
    return [];
  }

  const graph_config = resolvePatramGraphConfig(repo_config);
  const known_relation_names = new Set(Object.keys(graph_config.relations));
  /** @type {PatramDiagnostic[]} */
  const diagnostics = [];
  const class_coverage = new Map();

  for (const [summary_name, summary_definition] of Object.entries(
    repo_config.derived_summaries,
  )) {
    collectDuplicateClassDiagnostics(
      diagnostics,
      class_coverage,
      summary_definition.classes,
      summary_name,
    );
    collectDerivedSummaryFieldDiagnostics(
      diagnostics,
      known_relation_names,
      repo_config,
      summary_name,
      summary_definition.fields,
    );
  }

  return diagnostics;
}

/**
 * @returns {PatramRepoConfig}
 */
function createDefaultRepoConfig() {
  return {
    include: [...DEFAULT_INCLUDE_PATTERNS],
    queries: {},
  };
}

/**
 * @param {PatramRepoConfig} repo_config
 * @returns {PatramRepoConfig}
 */
function normalizeRepoConfig(repo_config) {
  /** @type {PatramRepoConfig} */
  const normalized_config = {
    include: [...repo_config.include],
    queries: { ...repo_config.queries },
  };

  assignOptionalRepoConfigField(
    normalized_config,
    'class_schemas',
    repo_config.class_schemas,
  );
  assignOptionalRepoConfigField(
    normalized_config,
    'classes',
    repo_config.classes,
  );
  assignOptionalRepoConfigField(
    normalized_config,
    'derived_summaries',
    repo_config.derived_summaries,
  );
  assignOptionalRepoConfigField(
    normalized_config,
    'fields',
    repo_config.fields,
  );
  assignOptionalRepoConfigField(
    normalized_config,
    'mappings',
    repo_config.mappings,
  );
  assignOptionalRepoConfigField(
    normalized_config,
    'path_classes',
    repo_config.path_classes,
  );
  assignOptionalRepoConfigField(
    normalized_config,
    'relations',
    repo_config.relations,
  );

  return normalized_config;
}

/**
 * @param {PatramDiagnostic[]} diagnostics
 * @param {Map<string, string>} class_coverage
 * @param {string[]} class_names
 * @param {string} summary_name
 */
function collectDuplicateClassDiagnostics(
  diagnostics,
  class_coverage,
  class_names,
  summary_name,
) {
  for (const class_name of class_names) {
    const existing_summary_name = class_coverage.get(class_name);

    if (!existing_summary_name) {
      class_coverage.set(class_name, summary_name);
      continue;
    }

    diagnostics.push(
      createConfigDiagnostic(
        `derived_summaries.${summary_name}.classes`,
        `Class "${class_name}" is already covered by derived summary "${existing_summary_name}".`,
      ),
    );
  }
}

/**
 * @param {PatramDiagnostic[]} diagnostics
 * @param {Set<string>} known_relation_names
 * @param {PatramRepoConfig} repo_config
 * @param {string} summary_name
 * @param {DerivedSummaryFieldConfig[]} field_definitions
 */
function collectDerivedSummaryFieldDiagnostics(
  diagnostics,
  known_relation_names,
  repo_config,
  summary_name,
  field_definitions,
) {
  for (const [field_index, field_definition] of field_definitions.entries()) {
    if ('count' in field_definition) {
      collectTraversalDiagnostic(
        diagnostics,
        field_definition.count.traversal,
        known_relation_names,
        `derived_summaries.${summary_name}.fields.${field_index}.count.traversal`,
      );
      collectWhereClauseDiagnostics(
        diagnostics,
        repo_config,
        field_definition.count.where,
        `derived_summaries.${summary_name}.fields.${field_index}.count.where`,
      );
      continue;
    }

    for (const [case_index, select_case] of field_definition.select.entries()) {
      collectWhereClauseDiagnostics(
        diagnostics,
        repo_config,
        select_case.when,
        `derived_summaries.${summary_name}.fields.${field_index}.select.${case_index}.when`,
      );
    }
  }
}

/**
 * @param {PatramDiagnostic[]} diagnostics
 * @param {string} traversal_text
 * @param {Set<string>} known_relation_names
 * @param {string} diagnostic_path
 */
function collectTraversalDiagnostic(
  diagnostics,
  traversal_text,
  known_relation_names,
  diagnostic_path,
) {
  const traversal_match =
    /^(?<direction>in|out):(?<relation_name>[a-zA-Z0-9_]+)$/du.exec(
      traversal_text,
    );

  if (!traversal_match?.groups?.relation_name) {
    diagnostics.push(
      createConfigDiagnostic(
        diagnostic_path,
        'Derived summary traversal must use "in:<relation>" or "out:<relation>".',
      ),
    );

    return;
  }

  if (known_relation_names.has(traversal_match.groups.relation_name)) {
    return;
  }

  diagnostics.push(
    createConfigDiagnostic(
      diagnostic_path,
      `Unknown relation "${traversal_match.groups.relation_name}" in derived summary traversal.`,
    ),
  );
}

/**
 * @param {PatramDiagnostic[]} diagnostics
 * @param {Record<string, { prefixes: string[] }>} path_classes
 * @param {Record<string, MetadataFieldConfig>} fields
 */
function collectFieldConfigDiagnostics(diagnostics, path_classes, fields) {
  for (const [field_name, field_definition] of Object.entries(fields)) {
    if (collectReservedFieldDiagnostic(diagnostics, field_name)) {
      continue;
    }

    collectDisplayOrderDiagnostic(diagnostics, field_name, field_definition);
    collectFieldPathClassDiagnostic(
      diagnostics,
      path_classes,
      field_name,
      field_definition,
    );
  }
}

/**
 * @param {PatramDiagnostic[]} diagnostics
 * @param {string} field_name
 * @returns {boolean}
 */
function collectReservedFieldDiagnostic(diagnostics, field_name) {
  if (
    !field_name.startsWith('$') ||
    !RESERVED_STRUCTURAL_FIELD_NAMES.has(field_name)
  ) {
    return false;
  }

  diagnostics.push(
    createConfigDiagnostic(
      `fields.${field_name}`,
      'Metadata field names must not start with "$".',
    ),
  );

  return true;
}

/**
 * @param {PatramDiagnostic[]} diagnostics
 * @param {string} field_name
 * @param {MetadataFieldConfig} field_definition
 */
function collectDisplayOrderDiagnostic(
  diagnostics,
  field_name,
  field_definition,
) {
  if (
    field_definition.display?.order === undefined ||
    (Number.isInteger(field_definition.display.order) &&
      field_definition.display.order >= 0)
  ) {
    return;
  }

  diagnostics.push(
    createConfigDiagnostic(
      `fields.${field_name}.display.order`,
      'Display order must be a non-negative integer.',
    ),
  );
}

/**
 * @param {PatramDiagnostic[]} diagnostics
 * @param {Record<string, { prefixes: string[] }>} path_classes
 * @param {string} field_name
 * @param {MetadataFieldConfig} field_definition
 */
function collectFieldPathClassDiagnostic(
  diagnostics,
  path_classes,
  field_name,
  field_definition,
) {
  if (
    !('path_class' in field_definition) ||
    field_definition.path_class === undefined
  ) {
    return;
  }

  if (field_definition.type !== 'path') {
    diagnostics.push(
      createConfigDiagnostic(
        `fields.${field_name}.path_class`,
        'Path classes are only valid for path fields.',
      ),
    );

    return;
  }

  if (path_classes[field_definition.path_class]) {
    return;
  }

  diagnostics.push(
    createConfigDiagnostic(
      `fields.${field_name}.path_class`,
      `Unknown path class "${field_definition.path_class}".`,
    ),
  );
}

/**
 * @param {PatramDiagnostic[]} diagnostics
 * @param {Record<string, { prefixes: string[] }>} path_classes
 * @param {Record<string, unknown>} classes
 * @param {Record<string, MetadataFieldConfig>} fields
 * @param {PatramRepoConfig['class_schemas']} class_schemas
 */
function collectClassSchemaConfigDiagnostics(
  diagnostics,
  path_classes,
  classes,
  fields,
  class_schemas,
) {
  if (!class_schemas) {
    return;
  }

  for (const class_name of Object.keys(class_schemas)) {
    if (classes[class_name]) {
      continue;
    }

    diagnostics.push(
      createConfigDiagnostic(
        `class_schemas.${class_name}`,
        `Unknown class "${class_name}".`,
      ),
    );
  }

  for (const [class_name, schema_definition] of Object.entries(class_schemas)) {
    for (const field_name of Object.keys(schema_definition.fields)) {
      if (fields[field_name]) {
        continue;
      }

      diagnostics.push(
        createConfigDiagnostic(
          `class_schemas.${class_name}.fields.${field_name}`,
          `Unknown field "${field_name}".`,
        ),
      );
    }
  }

  for (const [class_name, schema_definition] of Object.entries(class_schemas)) {
    if (
      schema_definition.document_path_class === undefined ||
      path_classes[schema_definition.document_path_class]
    ) {
      continue;
    }

    diagnostics.push(
      createConfigDiagnostic(
        `class_schemas.${class_name}.document_path_class`,
        `Unknown path class "${schema_definition.document_path_class}".`,
      ),
    );
  }
}

/**
 * @template {Exclude<keyof PatramRepoConfig, 'include' | 'queries'>} TKey
 * @param {PatramRepoConfig} normalized_config
 * @param {TKey} field_name
 * @param {unknown} field_value
 */
function assignOptionalRepoConfigField(
  normalized_config,
  field_name,
  field_value,
) {
  if (field_value === undefined || field_value === null) {
    return;
  }

  normalized_config[field_name] = /** @type {PatramRepoConfig[TKey]} */ (
    field_value
  );
}

/**
 * @param {PatramDiagnostic[]} diagnostics
 * @param {PatramRepoConfig} repo_config
 * @param {string} where_clause
 * @param {string} diagnostic_path
 */
function collectWhereClauseDiagnostics(
  diagnostics,
  repo_config,
  where_clause,
  diagnostic_path,
) {
  const parse_result = parseWhereClause(where_clause);

  if (!parse_result.success) {
    diagnostics.push(
      createConfigDiagnostic(diagnostic_path, parse_result.diagnostic.message),
    );

    return;
  }

  const semantic_diagnostics = getQuerySemanticDiagnostics(
    repo_config,
    { kind: 'ad_hoc' },
    parse_result.expression,
  );

  for (const semantic_diagnostic of semantic_diagnostics) {
    diagnostics.push(
      createConfigDiagnostic(diagnostic_path, semantic_diagnostic.message),
    );
  }
}

/**
 * @param {string} issue_path
 * @param {string} message
 * @returns {PatramDiagnostic}
 */
function createConfigDiagnostic(issue_path, message) {
  return {
    code: 'config.invalid',
    column: 1,
    level: 'error',
    line: 1,
    message: `Invalid config at "${issue_path}": ${message}`,
    path: CONFIG_FILE_NAME,
  };
}

/**
 * @param {unknown} error
 * @returns {error is NodeJS.ErrnoException}
 */
function isMissingFileError(error) {
  if (!(error instanceof Error)) {
    return false;
  }

  return 'code' in error && error.code === 'ENOENT';
}

/**
 * @param {string} config_source
 * @param {string} error_message
 * @returns {{ line: number, column: number }}
 */
function getJsonSyntaxOrigin(config_source, error_message) {
  const position_match = error_message.match(/position (?<offset>\d+)/du);

  if (position_match?.groups?.offset) {
    const offset = Number.parseInt(position_match.groups.offset, 10);

    return getLineAndColumnFromOffset(config_source, offset);
  }

  const token_match = error_message.match(/Unexpected token '(?<token>.)'/u);

  if (token_match?.groups?.token) {
    const offset = config_source.lastIndexOf(token_match.groups.token);

    if (offset >= 0) {
      return getLineAndColumnFromOffset(config_source, offset);
    }
  }

  return {
    column: 1,
    line: 1,
  };
}

/**
 * @param {(string | number | symbol | undefined)[]} issue_path
 * @returns {string}
 */
function formatIssuePath(issue_path) {
  return issue_path.map(String).join('.');
}

/**
 * @param {string} source_text
 * @param {number} offset
 * @returns {{ line: number, column: number }}
 */
function getLineAndColumnFromOffset(source_text, offset) {
  let line_number = 1;
  let column_number = 1;

  for (const character of source_text.slice(0, offset)) {
    if (character === '\n') {
      line_number += 1;
      column_number = 1;
      continue;
    }

    column_number += 1;
  }

  return {
    column: column_number,
    line: line_number,
  };
}
