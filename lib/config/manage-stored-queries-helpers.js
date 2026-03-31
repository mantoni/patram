/**
 * @import {
 *   PatramDiagnostic,
 *   StoredQueryConfig,
 * } from './load-patram-config.types.ts';
 */

import { readFile, writeFile } from 'node:fs/promises';

import { parsePatramConfigSource } from './load-patram-config.js';
import { CONFIG_FILE_NAME } from './schema.js';
import { validatePatramConfigValue } from './validate-patram-config-value.js';

/**
 * @param {string} config_file_path
 * @returns {Promise<
 *   | { success: true, value: Record<string, unknown> }
 *   | { diagnostic: PatramDiagnostic, success: false }
 * >}
 */
export async function loadRawConfig(config_file_path) {
  const config_source = await readConfigSource(config_file_path);

  if (config_source === null) {
    return {
      success: true,
      value: {},
    };
  }

  const parse_result = parsePatramConfigSource(config_source);

  if (!parse_result.success) {
    return parse_result;
  }

  if (
    parse_result.value === null ||
    typeof parse_result.value !== 'object' ||
    Array.isArray(parse_result.value)
  ) {
    return {
      diagnostic: createInvalidTopLevelConfigDiagnostic(),
      success: false,
    };
  }

  return {
    success: true,
    value: /** @type {Record<string, unknown>} */ (parse_result.value),
  };
}

/**
 * @param {string} config_file_path
 * @param {Record<string, unknown>} raw_config
 * @param {StoredQueryMutationResult} mutation_result
 * @returns {Promise<
 *   | { success: true, value: StoredQueryMutationResult }
 *   | { diagnostics: PatramDiagnostic[], success: false }
 * >}
 */
export async function persistStoredQueryMutation(
  config_file_path,
  raw_config,
  mutation_result,
) {
  const validation_result = validatePatramConfigValue(raw_config);

  if (!validation_result.success) {
    return {
      diagnostics: validation_result.diagnostics,
      success: false,
    };
  }

  await writeFile(config_file_path, `${JSON.stringify(raw_config, null, 2)}\n`);

  return {
    success: true,
    value: mutation_result,
  };
}

/**
 * @param {string} where_clause
 * @param {string | undefined} description
 * @returns {StoredQueryConfig}
 */
export function createStoredQueryDefinition(where_clause, description) {
  /** @type {StoredQueryConfig} */
  const stored_query = {
    where: where_clause,
  };
  const normalized_description = normalizeDescription(description);

  if (normalized_description !== undefined) {
    stored_query.description = normalized_description;
  }

  return stored_query;
}

/**
 * @param {Record<string, unknown> | null} raw_query_value
 * @param {StoredQueryConfig} existing_query
 * @param {{ description?: string, where?: string }} stored_query_mutation
 * @returns {StoredQueryConfig}
 */
export function createUpdatedStoredQueryDefinition(
  raw_query_value,
  existing_query,
  stored_query_mutation,
) {
  /** @type {StoredQueryConfig} */
  const next_query = {
    where: existing_query.where,
  };

  if (
    raw_query_value &&
    Object.hasOwn(raw_query_value, 'description') &&
    typeof raw_query_value.description === 'string' &&
    raw_query_value.description.length > 0
  ) {
    next_query.description = raw_query_value.description;
  } else if (
    typeof existing_query.description === 'string' &&
    existing_query.description.length > 0
  ) {
    next_query.description = existing_query.description;
  }

  if (stored_query_mutation.where !== undefined) {
    next_query.where = stored_query_mutation.where;
  }

  if (stored_query_mutation.description !== undefined) {
    if (stored_query_mutation.description.length === 0) {
      delete next_query.description;
    } else {
      next_query.description = stored_query_mutation.description;
    }
  }

  return next_query;
}

/**
 * @param {Record<string, unknown>} raw_config
 * @returns {Record<string, unknown>}
 */
export function ensureRawQueries(raw_config) {
  const raw_queries_value = raw_config.queries;

  if (
    raw_queries_value !== null &&
    typeof raw_queries_value === 'object' &&
    !Array.isArray(raw_queries_value)
  ) {
    return /** @type {Record<string, unknown>} */ (raw_queries_value);
  }

  /** @type {Record<string, unknown>} */
  const raw_queries = {};
  raw_config.queries = raw_queries;

  return raw_queries;
}

/**
 * @param {unknown} raw_query_value
 * @returns {Record<string, unknown> | null}
 */
export function rawQueryValueToRecord(raw_query_value) {
  if (
    raw_query_value === null ||
    typeof raw_query_value !== 'object' ||
    Array.isArray(raw_query_value)
  ) {
    return null;
  }

  return /** @type {Record<string, unknown>} */ (raw_query_value);
}

/**
 * @param {string | undefined} description
 * @returns {string | undefined}
 */
function normalizeDescription(description) {
  if (description === undefined || description.length === 0) {
    return undefined;
  }

  return description;
}

/**
 * @returns {PatramDiagnostic}
 */
function createInvalidTopLevelConfigDiagnostic() {
  return {
    code: 'config.invalid',
    column: 1,
    level: 'error',
    line: 1,
    message: 'Invalid config: Expected a top-level object.',
    path: CONFIG_FILE_NAME,
  };
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
 * @typedef {{
 *   action: 'added',
 *   name: string,
 * } | {
 *   action: 'removed',
 *   name: string,
 * } | {
 *   action: 'updated',
 *   name: string,
 *   previous_name?: string,
 * }} StoredQueryMutationResult
 */
