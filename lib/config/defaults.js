/**
 * @import { PatramRepoConfig } from './schema.js';
 */

import { DEFAULT_INCLUDE_PATTERNS } from './source-file-defaults.js';

/**
 * @returns {PatramRepoConfig}
 */
export function createDefaultRepoConfig() {
  return {
    include: [...DEFAULT_INCLUDE_PATTERNS],
    queries: {},
  };
}

/**
 * @param {PatramRepoConfig} repo_config
 * @returns {PatramRepoConfig}
 */
export function normalizeRepoConfig(repo_config) {
  /** @type {PatramRepoConfig} */
  const normalized_config = {
    include: [...repo_config.include],
    queries: { ...repo_config.queries },
  };

  assignOptionalRepoConfigField(
    normalized_config,
    'fields',
    repo_config.fields,
  );
  assignOptionalRepoConfigField(normalized_config, 'types', repo_config.types);

  return normalized_config;
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

  if (field_name === 'types') {
    normalized_config.types = normalizeTypes(
      /** @type {PatramRepoConfig['types']} */ (field_value),
    );
    return;
  }

  normalized_config[field_name] = /** @type {PatramRepoConfig[TKey]} */ (
    field_value
  );
}

/**
 * @param {PatramRepoConfig['types']} types
 * @returns {PatramRepoConfig['types']}
 */
function normalizeTypes(types) {
  if (!types) {
    return types;
  }

  /** @type {NonNullable<PatramRepoConfig['types']>} */
  const normalized_types = {};

  for (const [type_name, type_definition] of Object.entries(types)) {
    normalized_types[type_name] = {
      ...type_definition,
    };

    if (typeof type_definition.in === 'string') {
      normalized_types[type_name].in = [type_definition.in];
    }
  }

  return normalized_types;
}
