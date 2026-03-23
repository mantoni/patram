/* eslint-disable max-lines */
/**
 * @import { LoadPatramConfigResult, PatramDiagnostic, PatramRepoConfig } from './load-patram-config.types.ts';
 */

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import process from 'node:process';

import { z } from 'zod';

import { parsePatramConfig } from './patram-config.js';
import { parseWhereClause } from './parse-where-clause.js';
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

const stored_query_schema = z
  .object({
    where: z.string().min(1, 'Stored query "where" must not be empty.'),
  })
  .strict();

const derived_summary_scalar_schema = z.union([
  z.boolean(),
  z.number(),
  z.string(),
  z.null(),
]);

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

const derived_summary_select_case_schema = z
  .object({
    value: derived_summary_scalar_schema,
    when: z.string().min(1, 'Derived summary select "when" must not be empty.'),
  })
  .strict();

const derived_summary_field_schema = z
  .object({
    count: derived_summary_count_schema.optional(),
    default: derived_summary_scalar_schema.optional(),
    name: z
      .string()
      .regex(
        /^[a-z][a-z0-9_]*$/du,
        'Derived summary field names must use lower_snake_case.',
      ),
    select: z.array(derived_summary_select_case_schema).optional(),
  })
  .strict()
  .superRefine(validateDerivedSummaryFieldDefinition);

const derived_summary_schema = z
  .object({
    fields: z
      .array(derived_summary_field_schema)
      .min(1, 'Derived summary "fields" must contain at least one field.'),
    kinds: z
      .array(z.string().min(1))
      .min(1, 'Derived summary "kinds" must contain at least one kind.'),
  })
  .strict()
  .superRefine(validateDerivedSummaryDefinition);

const patram_repo_config_schema = z
  .object({
    derived_summaries: z
      .record(z.string().min(1), derived_summary_schema)
      .optional(),
    include: z
      .array(z.string().min(1, 'Include globs must not be empty.'))
      .min(1, 'Include must contain at least one glob.')
      .default(DEFAULT_INCLUDE_PATTERNS),
    kinds: z.unknown().optional(),
    mappings: z.unknown().optional(),
    queries: z.record(z.string().min(1), stored_query_schema).default({}),
    relations: z.unknown().optional(),
  })
  .strict();

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
 * @param {{ count?: unknown, default?: unknown, select?: unknown }} field_definition
 * @param {import('zod').RefinementCtx} refinement_context
 */
function validateDerivedSummaryFieldDefinition(
  field_definition,
  refinement_context,
) {
  const evaluator_count =
    Number(field_definition.count !== undefined) +
    Number(field_definition.select !== undefined);

  if (evaluator_count !== 1) {
    refinement_context.addIssue({
      code: 'custom',
      message:
        'Derived summary fields must define exactly one of "count" or "select".',
    });
  }

  if (
    field_definition.count !== undefined &&
    field_definition.default !== undefined
  ) {
    refinement_context.addIssue({
      code: 'custom',
      message: 'Derived summary count fields must not define "default".',
      path: ['default'],
    });
  }

  if (field_definition.select === undefined) {
    return;
  }

  if (
    Array.isArray(field_definition.select) &&
    field_definition.select.length === 0
  ) {
    refinement_context.addIssue({
      code: 'custom',
      message: 'Derived summary "select" must contain at least one case.',
      path: ['select'],
    });
  }

  if (field_definition.default === undefined) {
    refinement_context.addIssue({
      code: 'custom',
      message: 'Derived summary select fields must define "default".',
      path: ['default'],
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
 * @param {{ include: string[], queries: Record<string, { where: string }>, kinds?: unknown, mappings?: unknown, relations?: unknown }} repo_config
 * @returns {PatramDiagnostic[]}
 */
function validateGraphSchema(repo_config) {
  if (
    repo_config.kinds === undefined &&
    repo_config.mappings === undefined &&
    repo_config.relations === undefined
  ) {
    return [];
  }

  try {
    parsePatramConfig({
      kinds: repo_config.kinds ?? {},
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
function validateDerivedSummaries(repo_config) {
  if (!repo_config.derived_summaries) {
    return [];
  }

  const graph_config = resolvePatramGraphConfig(repo_config);
  const known_relation_names = new Set(Object.keys(graph_config.relations));
  /** @type {PatramDiagnostic[]} */
  const diagnostics = [];
  const kind_coverage = new Map();

  for (const [summary_name, summary_definition] of Object.entries(
    repo_config.derived_summaries,
  )) {
    collectDuplicateKindDiagnostics(
      diagnostics,
      kind_coverage,
      summary_definition.kinds,
      summary_name,
    );
    collectDerivedSummaryFieldDiagnostics(
      diagnostics,
      known_relation_names,
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
 * @param {{ derived_summaries?: unknown, include: string[], queries: Record<string, { where: string }>, kinds?: unknown, mappings?: unknown, relations?: unknown }} repo_config
 * @returns {PatramRepoConfig}
 */
function normalizeRepoConfig(repo_config) {
  /** @type {PatramRepoConfig} */
  const normalized_config = {
    include: [...repo_config.include],
    queries: { ...repo_config.queries },
  };

  if (
    repo_config.derived_summaries !== undefined &&
    repo_config.derived_summaries !== null
  ) {
    normalized_config.derived_summaries =
      /** @type {PatramRepoConfig['derived_summaries']} */ (
        repo_config.derived_summaries
      );
  }

  if (repo_config.kinds !== undefined && repo_config.kinds !== null) {
    normalized_config.kinds = /** @type {PatramRepoConfig['kinds']} */ (
      repo_config.kinds
    );
  }

  if (repo_config.mappings !== undefined && repo_config.mappings !== null) {
    normalized_config.mappings = /** @type {PatramRepoConfig['mappings']} */ (
      repo_config.mappings
    );
  }

  if (repo_config.relations !== undefined && repo_config.relations !== null) {
    normalized_config.relations = /** @type {PatramRepoConfig['relations']} */ (
      repo_config.relations
    );
  }

  return normalized_config;
}

/**
 * @param {PatramDiagnostic[]} diagnostics
 * @param {Map<string, string>} kind_coverage
 * @param {string[]} kind_names
 * @param {string} summary_name
 */
function collectDuplicateKindDiagnostics(
  diagnostics,
  kind_coverage,
  kind_names,
  summary_name,
) {
  for (const kind_name of kind_names) {
    const existing_summary_name = kind_coverage.get(kind_name);

    if (!existing_summary_name) {
      kind_coverage.set(kind_name, summary_name);
      continue;
    }

    diagnostics.push(
      createConfigDiagnostic(
        `derived_summaries.${summary_name}.kinds`,
        `Kind "${kind_name}" is already covered by derived summary "${existing_summary_name}".`,
      ),
    );
  }
}

/**
 * @param {PatramDiagnostic[]} diagnostics
 * @param {Set<string>} known_relation_names
 * @param {string} summary_name
 * @param {import('./load-patram-config.types.ts').DerivedSummaryFieldConfig[]} field_definitions
 */
function collectDerivedSummaryFieldDiagnostics(
  diagnostics,
  known_relation_names,
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
        field_definition.count.where,
        known_relation_names,
        `derived_summaries.${summary_name}.fields.${field_index}.count.where`,
      );
      continue;
    }

    for (const [case_index, select_case] of field_definition.select.entries()) {
      collectWhereClauseDiagnostics(
        diagnostics,
        select_case.when,
        known_relation_names,
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
 * @param {string} where_clause
 * @param {Set<string>} known_relation_names
 * @param {string} diagnostic_path
 */
function collectWhereClauseDiagnostics(
  diagnostics,
  where_clause,
  known_relation_names,
  diagnostic_path,
) {
  const parse_result = parseWhereClause(where_clause);

  if (!parse_result.success) {
    diagnostics.push(
      createConfigDiagnostic(diagnostic_path, parse_result.diagnostic.message),
    );

    return;
  }

  for (const clause of parse_result.clauses) {
    collectClauseRelationDiagnostics(
      diagnostics,
      clause.term,
      known_relation_names,
      diagnostic_path,
    );
  }
}

/**
 * @param {PatramDiagnostic[]} diagnostics
 * @param {import('./parse-where-clause.types.ts').ParsedTerm} term
 * @param {Set<string>} known_relation_names
 * @param {string} diagnostic_path
 */
function collectClauseRelationDiagnostics(
  diagnostics,
  term,
  known_relation_names,
  diagnostic_path,
) {
  if (term.kind === 'aggregate') {
    if (!known_relation_names.has(term.traversal.relation_name)) {
      diagnostics.push(
        createConfigDiagnostic(
          diagnostic_path,
          `Unknown relation "${term.traversal.relation_name}" in traversal clause.`,
        ),
      );
    }

    for (const nested_clause of term.clauses) {
      collectClauseRelationDiagnostics(
        diagnostics,
        nested_clause.term,
        known_relation_names,
        diagnostic_path,
      );
    }

    return;
  }

  if (term.kind !== 'relation' && term.kind !== 'relation_target') {
    return;
  }

  if (known_relation_names.has(term.relation_name)) {
    return;
  }

  diagnostics.push(
    createConfigDiagnostic(
      diagnostic_path,
      `Unknown relation "${term.relation_name}" in relation clause.`,
    ),
  );
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
