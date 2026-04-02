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
    'classes',
    repo_config.classes,
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
