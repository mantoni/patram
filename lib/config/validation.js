/**
 * @import { ClassDefinition } from './patram-config.js';
 * @import { MetadataFieldConfig, PatramRepoConfig } from './schema.js';
 * @import { PatramDiagnostic } from './load-patram-config.js';
 */
/* eslint-disable max-lines */

import { z } from 'zod';

import { parsePatramConfig } from './patram-config.js';
import { getQuerySemanticDiagnostics } from '../graph/query/inspect.js';
import { parseQueryExpression } from '../graph/query/parse-query.js';
import {
  CONFIG_FILE_NAME,
  isKnownMarkdownStyle,
  isMixedStyleValue,
  isReservedStructuralFieldName,
} from './schema.js';

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

  const structural_mapping_diagnostics =
    collectStructuralMappingDiagnostics(repo_config);

  if (structural_mapping_diagnostics.length > 0) {
    return structural_mapping_diagnostics;
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
    const query_text = stored_query.cypher;

    if (!query_text) {
      continue;
    }

    collectWhereClauseDiagnostics(
      diagnostics,
      repo_config,
      query_text,
      `queries.${query_name}.cypher`,
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
// eslint-disable-next-line max-lines-per-function
function collectClassSchemaConfigDiagnostics(
  diagnostics,
  path_classes,
  fields,
  classes,
) {
  for (const [class_name, class_definition] of Object.entries(classes)) {
    const schema_definition = class_definition.schema;
    const identity_definition = class_definition.identity;

    collectClassIdentityConfigDiagnostics(
      diagnostics,
      class_name,
      identity_definition,
      schema_definition,
    );

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
 * @param {string} class_name
 * @param {import('./load-patram-config.types.ts').ClassIdentityConfig | undefined} identity_definition
 * @param {import('./load-patram-config.types.ts').ClassSchemaConfig | undefined} schema_definition
 */
function collectClassIdentityConfigDiagnostics(
  diagnostics,
  class_name,
  identity_definition,
  schema_definition,
) {
  if (!identity_definition) {
    return;
  }

  if (
    identity_definition.type === 'document_path' &&
    schema_definition?.document_path_class === undefined
  ) {
    diagnostics.push(
      createConfigDiagnostic(
        `classes.${class_name}.identity`,
        'Document-path identity requires classes.<name>.schema.document_path_class.',
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
  const parse_result = parseQueryExpression(where_clause, repo_config);

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
 * @param {PatramRepoConfig} repo_config
 * @returns {PatramDiagnostic[]}
 */
function collectStructuralMappingDiagnostics(repo_config) {
  /** @type {PatramDiagnostic[]} */
  const diagnostics = [];

  for (const [mapping_name, mapping_definition] of Object.entries(
    repo_config.mappings ?? {},
  )) {
    const field_name = mapping_definition.node?.field;

    if (!field_name || !isReservedStructuralFieldName(field_name)) {
      continue;
    }

    diagnostics.push(
      createConfigDiagnostic(
        `mappings.${mapping_name}.node.field`,
        'Structural mapping fields are not supported.',
      ),
    );
  }

  return diagnostics;
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
