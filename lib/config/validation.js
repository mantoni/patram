/**
 * @import { MetadataFieldConfig, PatramRepoConfig, PatramDiagnostic } from './load-patram-config.types.ts';
 */

import { CONFIG_FILE_NAME, isReservedStructuralFieldName } from './schema.js';
import { getQuerySemanticDiagnostics } from '../graph/query/inspect.js';
import { parseQueryExpression } from '../graph/query/parse-query.js';

const LEGACY_TOP_LEVEL_KEYS = {
  class_schemas:
    'Top-level "class_schemas" is not supported. Use "types" and field rules.',
  classes: 'Top-level "classes" is not supported. Use "types".',
  mappings: 'Top-level "mappings" is not supported.',
  path_classes: 'Top-level "path_classes" is not supported.',
  relations: 'Top-level "relations" is not supported. Use ref fields.',
};

/**
 * @param {unknown} config_value
 * @returns {PatramDiagnostic[]}
 */
export function validateLegacyConfigShape(config_value) {
  if (
    config_value === null ||
    typeof config_value !== 'object' ||
    Array.isArray(config_value)
  ) {
    return [];
  }

  /** @type {PatramDiagnostic[]} */
  const diagnostics = [];

  for (const [legacy_key, message] of Object.entries(LEGACY_TOP_LEVEL_KEYS)) {
    if (!Object.hasOwn(config_value, legacy_key)) {
      continue;
    }

    diagnostics.push(createConfigDiagnostic(legacy_key, message));
  }

  return diagnostics;
}

/**
 * @param {PatramRepoConfig} repo_config
 * @returns {PatramDiagnostic[]}
 */
export function validateFieldSchemaConfig(repo_config) {
  const fields = repo_config.fields ?? {};
  const types = repo_config.types ?? {};
  /** @type {PatramDiagnostic[]} */
  const diagnostics = [];

  for (const [field_name, field_definition] of Object.entries(fields)) {
    diagnostics.push(
      ...validateFieldDefinition(field_name, field_definition, types),
    );
  }

  for (const [type_name, type_definition] of Object.entries(types)) {
    diagnostics.push(
      ...validateTypeDefinition(type_name, type_definition, fields),
    );
  }

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
 * @param {PatramDiagnostic[]} diagnostics
 * @param {string} field_path
 * @param {string[] | undefined} referenced_types
 * @param {NonNullable<PatramRepoConfig['types']>} types
 */
function collectTypeReferenceDiagnostics(
  diagnostics,
  field_path,
  referenced_types,
  types,
) {
  for (const referenced_type of referenced_types ?? []) {
    if (types[referenced_type] !== undefined) {
      continue;
    }

    diagnostics.push(
      createConfigDiagnostic(field_path, `Unknown type "${referenced_type}".`),
    );
  }
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
    diagnostics.push(replaceDiagnosticPath(parse_result.diagnostic));
    return;
  }

  diagnostics.push(
    ...getQuerySemanticDiagnostics(
      repo_config,
      { kind: 'stored_query', name: diagnostic_path.split('.')[1] ?? '' },
      parse_result.expression,
    ),
  );
}

/**
 * @param {string} path
 * @param {string} message
 * @returns {PatramDiagnostic}
 */
function createConfigDiagnostic(path, message) {
  return {
    code: 'config.invalid',
    column: 1,
    level: 'error',
    line: 1,
    message: `Invalid config at "${path}": ${message}`,
    path: CONFIG_FILE_NAME,
  };
}

/**
 * @param {string} field_name
 * @param {MetadataFieldConfig} field_definition
 * @param {NonNullable<PatramRepoConfig['types']>} types
 * @returns {PatramDiagnostic[]}
 */
function validateFieldDefinition(field_name, field_definition, types) {
  /** @type {PatramDiagnostic[]} */
  const diagnostics = [];

  if (isReservedStructuralFieldName(field_name)) {
    diagnostics.push(
      createConfigDiagnostic(
        `fields.${field_name}`,
        'Metadata field names must not start with "$".',
      ),
    );
  }

  collectTypeReferenceDiagnostics(
    diagnostics,
    `fields.${field_name}.on`,
    field_definition.on,
    types,
  );
  collectTypeReferenceDiagnostics(
    diagnostics,
    `fields.${field_name}.required_on`,
    field_definition.required_on,
    types,
  );

  if (
    field_definition.type === 'ref' &&
    field_definition.to !== 'document' &&
    types[field_definition.to] === undefined
  ) {
    diagnostics.push(
      createConfigDiagnostic(
        `fields.${field_name}.to`,
        `Unknown target type "${field_definition.to}".`,
      ),
    );
  }

  return diagnostics;
}

/**
 * @param {string} type_name
 * @param {NonNullable<PatramRepoConfig['types']>[string]} type_definition
 * @param {NonNullable<PatramRepoConfig['fields']>} fields
 * @returns {PatramDiagnostic[]}
 */
function validateTypeDefinition(type_name, type_definition, fields) {
  if (
    type_definition.defined_by !== undefined &&
    fields[type_definition.defined_by] === undefined
  ) {
    return [
      createConfigDiagnostic(
        `types.${type_name}.defined_by`,
        `Unknown field "${type_definition.defined_by}".`,
      ),
    ];
  }

  const defined_by_field = type_definition.defined_by
    ? fields[type_definition.defined_by]
    : undefined;

  if (defined_by_field?.type !== 'ref') {
    return [];
  }

  return [
    createConfigDiagnostic(
      `types.${type_name}.defined_by`,
      'Type identity fields must use a scalar field type.',
    ),
  ];
}

/**
 * @param {PatramDiagnostic} diagnostic
 * @returns {PatramDiagnostic}
 */
function replaceDiagnosticPath(diagnostic) {
  return {
    ...diagnostic,
    path: CONFIG_FILE_NAME,
  };
}
