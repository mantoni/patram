/**
 * @import { ClassDefinition } from './patram-config.js';
 * @import {
 *   DerivedSummaryFieldConfig,
 *   MetadataFieldConfig,
 *   PatramRepoConfig,
 * } from './schema.js';
 * @import { PatramDiagnostic } from './load-patram-config.js';
 */
/* eslint-disable max-lines */

import { z } from 'zod';

import { parsePatramConfig } from './patram-config.js';
import { resolvePatramGraphConfig } from './resolve-patram-graph-config.js';
import {
  CONFIG_FILE_NAME,
  isKnownMarkdownStyle,
  isMixedStyleValue,
  isReservedStructuralFieldName,
} from './schema.js';
import { getQuerySemanticDiagnostics } from '../graph/query-inspection.js';
import { parseWhereClause } from '../graph/parse-where-clause.js';

/**
 * @param {unknown} config_value
 * @returns {PatramDiagnostic[]}
 */
export function validateLegacyConfigShape(config_value) {
  if (
    config_value === null ||
    typeof config_value !== 'object' ||
    !Object.hasOwn(config_value, 'class_schemas')
  ) {
    return [];
  }

  return [
    createConfigDiagnostic(
      'class_schemas',
      'Top-level "class_schemas" is not supported. Move entries into classes.<name>.schema.',
    ),
  ];
}

/**
 * @param {PatramRepoConfig} repo_config
 * @returns {PatramDiagnostic[]}
 */
export function validateGraphSchema(repo_config) {
  if (
    repo_config.classes === undefined &&
    repo_config.mappings === undefined &&
    repo_config.relations === undefined
  ) {
    return [];
  }

  try {
    parsePatramConfig({
      classes: collectGraphClassDefinitions(repo_config.classes),
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
export function validateFieldSchemaConfig(repo_config) {
  const path_classes = repo_config.path_classes ?? {};
  const classes = repo_config.classes ?? {};
  const fields = repo_config.fields ?? {};
  /** @type {PatramDiagnostic[]} */
  const diagnostics = [];

  collectFieldConfigDiagnostics(diagnostics, path_classes, fields);
  collectClassSchemaConfigDiagnostics(
    diagnostics,
    path_classes,
    fields,
    classes,
  );

  return diagnostics;
}

/**
 * @param {PatramRepoConfig} repo_config
 * @returns {PatramDiagnostic[]}
 */
export function validateStoredQueries(repo_config) {
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
export function validateDerivedSummaries(repo_config) {
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
    !isReservedStructuralFieldName(field_name)
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
 * @param {Record<string, MetadataFieldConfig>} fields
 * @param {NonNullable<PatramRepoConfig['classes']>} classes
 */
function collectClassSchemaConfigDiagnostics(
  diagnostics,
  path_classes,
  fields,
  classes,
) {
  for (const [class_name, class_definition] of Object.entries(classes)) {
    const schema_definition = class_definition.schema;

    if (!schema_definition) {
      continue;
    }

    collectMarkdownStylesDiagnostic(
      diagnostics,
      `classes.${class_name}.schema.markdown_styles`,
      schema_definition.markdown_styles,
    );
    collectMixedStylesDiagnostic(
      diagnostics,
      `classes.${class_name}.schema.mixed_styles`,
      schema_definition.mixed_styles,
    );

    for (const field_name of Object.keys(schema_definition.fields)) {
      if (fields[field_name]) {
        collectMarkdownStylesDiagnostic(
          diagnostics,
          `classes.${class_name}.schema.fields.${field_name}.markdown_styles`,
          schema_definition.fields[field_name].markdown_styles,
        );
      } else {
        diagnostics.push(
          createConfigDiagnostic(
            `classes.${class_name}.schema.fields.${field_name}`,
            `Unknown field "${field_name}".`,
          ),
        );
      }
    }
  }

  for (const [class_name, class_definition] of Object.entries(classes)) {
    const schema_definition = class_definition.schema;

    if (!schema_definition) {
      continue;
    }

    if (
      schema_definition.document_path_class === undefined ||
      path_classes[schema_definition.document_path_class]
    ) {
      continue;
    }

    diagnostics.push(
      createConfigDiagnostic(
        `classes.${class_name}.schema.document_path_class`,
        `Unknown path class "${schema_definition.document_path_class}".`,
      ),
    );
  }
}

/**
 * @param {PatramDiagnostic[]} diagnostics
 * @param {string} diagnostic_path
 * @param {string[] | undefined} markdown_styles
 */
function collectMarkdownStylesDiagnostic(
  diagnostics,
  diagnostic_path,
  markdown_styles,
) {
  if (markdown_styles === undefined) {
    return;
  }

  if (markdown_styles.length === 0) {
    diagnostics.push(
      createConfigDiagnostic(
        diagnostic_path,
        'Markdown styles must contain at least one style.',
      ),
    );

    return;
  }

  for (const markdown_style of markdown_styles) {
    if (isKnownMarkdownStyle(markdown_style)) {
      continue;
    }

    diagnostics.push(
      createConfigDiagnostic(
        diagnostic_path,
        `Unknown markdown style "${markdown_style}".`,
      ),
    );
  }
}

/**
 * @param {PatramDiagnostic[]} diagnostics
 * @param {string} diagnostic_path
 * @param {string | undefined} mixed_styles
 */
function collectMixedStylesDiagnostic(
  diagnostics,
  diagnostic_path,
  mixed_styles,
) {
  if (mixed_styles === undefined || isMixedStyleValue(mixed_styles)) {
    return;
  }

  diagnostics.push(
    createConfigDiagnostic(
      diagnostic_path,
      'Mixed styles must be "ignore" or "error".',
    ),
  );
}

/**
 * @param {PatramRepoConfig['classes']} classes
 * @returns {Record<string, ClassDefinition>}
 */
function collectGraphClassDefinitions(classes) {
  /** @type {Record<string, ClassDefinition>} */
  const graph_class_definitions = {};

  for (const [class_name, class_definition] of Object.entries(classes ?? {})) {
    graph_class_definitions[class_name] = {
      builtin: class_definition.builtin,
      label: class_definition.label,
    };
  }

  return graph_class_definitions;
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
 * @param {(string | number | symbol | undefined)[]} issue_path
 * @returns {string}
 */
function formatIssuePath(issue_path) {
  return issue_path.map(String).join('.');
}
