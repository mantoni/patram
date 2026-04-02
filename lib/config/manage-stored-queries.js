/**
 * @import { CliParseError } from '../cli/arguments.types.ts';
 * @import {
 *   PatramDiagnostic,
 *   PatramRepoConfig,
 * } from './load-patram-config.types.ts';
 */

import { resolve } from 'node:path';

import { loadPatramConfig } from './load-patram-config.js';
import {
  createStoredQueryDefinition,
  createUpdatedStoredQueryDefinition,
  ensureRawQueries,
  loadRawConfig,
  persistStoredQueryMutation,
  rawQueryValueToRecord,
} from './manage-stored-queries-helpers.js';
import { CONFIG_FILE_NAME } from './schema.js';
import { createUnknownStoredQueryError } from '../graph/query/resolve.js';

/**
 * @typedef {{
 *   action: 'add',
 *   cypher?: string,
 *   description?: string,
 *   name: string,
 *   where?: string,
 * } | {
 *   action: 'remove',
 *   name: string,
 * } | {
 *   action: 'update',
 *   cypher?: string,
 *   description?: string,
 *   name: string,
 *   next_name?: string,
 *   where?: string,
 * }} StoredQueryMutation
 */

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

/**
 * @param {string} project_directory
 * @param {StoredQueryMutation} stored_query_mutation
 * @returns {Promise<
 *   | { success: true, value: StoredQueryMutationResult }
 *   | { diagnostics: PatramDiagnostic[], success: false }
 *   | { error: CliParseError, success: false }
 * >}
 */
export async function manageStoredQueries(
  project_directory,
  stored_query_mutation,
) {
  const load_result = await loadPatramConfig(project_directory);

  if (load_result.diagnostics.length > 0) {
    return {
      diagnostics: load_result.diagnostics,
      success: false,
    };
  }

  const repo_config = load_result.config;

  if (!repo_config) {
    throw new Error('Expected a valid Patram repo config.');
  }

  const config_file_path = resolve(project_directory, CONFIG_FILE_NAME);
  const raw_config_result = await loadRawConfig(config_file_path);

  if (!raw_config_result.success) {
    return {
      diagnostics: [raw_config_result.diagnostic],
      success: false,
    };
  }

  if (stored_query_mutation.action === 'add') {
    return applyAddStoredQuery(
      config_file_path,
      raw_config_result.value,
      repo_config,
      stored_query_mutation,
    );
  }

  if (stored_query_mutation.action === 'remove') {
    return applyRemoveStoredQuery(
      config_file_path,
      raw_config_result.value,
      repo_config,
      stored_query_mutation,
    );
  }

  return applyUpdateStoredQuery(
    config_file_path,
    raw_config_result.value,
    repo_config,
    stored_query_mutation,
  );
}

/**
 * @param {string} config_file_path
 * @param {Record<string, unknown>} raw_config
 * @param {PatramRepoConfig} repo_config
 * @param {{ cypher?: string, description?: string, name: string, where?: string }} stored_query_mutation
 * @returns {Promise<
 *   | { success: true, value: StoredQueryMutationResult }
 *   | { diagnostics: PatramDiagnostic[], success: false }
 *   | { error: CliParseError, success: false }
 * >}
 */
async function applyAddStoredQuery(
  config_file_path,
  raw_config,
  repo_config,
  stored_query_mutation,
) {
  if (repo_config.queries[stored_query_mutation.name]) {
    return {
      error: {
        code: 'message',
        message: `Stored query already exists: ${stored_query_mutation.name}.`,
      },
      success: false,
    };
  }

  const raw_queries = ensureRawQueries(raw_config);
  const query_text =
    stored_query_mutation.cypher ?? stored_query_mutation.where;

  if (!query_text) {
    throw new Error('Expected add mutations to contain query text.');
  }

  raw_queries[stored_query_mutation.name] = createStoredQueryDefinition(
    query_text,
    stored_query_mutation.description,
    stored_query_mutation.cypher !== undefined ? 'cypher' : 'where',
  );

  return persistStoredQueryMutation(config_file_path, raw_config, {
    action: 'added',
    name: stored_query_mutation.name,
  });
}

/**
 * @param {string} config_file_path
 * @param {Record<string, unknown>} raw_config
 * @param {PatramRepoConfig} repo_config
 * @param {{ name: string }} stored_query_mutation
 * @returns {Promise<
 *   | { success: true, value: StoredQueryMutationResult }
 *   | { diagnostics: PatramDiagnostic[], success: false }
 *   | { error: CliParseError, success: false }
 * >}
 */
async function applyRemoveStoredQuery(
  config_file_path,
  raw_config,
  repo_config,
  stored_query_mutation,
) {
  if (!repo_config.queries[stored_query_mutation.name]) {
    return {
      error: createQueryMutationUnknownStoredQueryError(
        stored_query_mutation.name,
        Object.keys(repo_config.queries),
        'remove',
      ),
      success: false,
    };
  }

  const raw_queries = ensureRawQueries(raw_config);
  delete raw_queries[stored_query_mutation.name];

  return persistStoredQueryMutation(config_file_path, raw_config, {
    action: 'removed',
    name: stored_query_mutation.name,
  });
}

/**
 * @param {string} config_file_path
 * @param {Record<string, unknown>} raw_config
 * @param {PatramRepoConfig} repo_config
 * @param {{ cypher?: string, description?: string, name: string, next_name?: string, where?: string }} stored_query_mutation
 * @returns {Promise<
 *   | { success: true, value: StoredQueryMutationResult }
 *   | { diagnostics: PatramDiagnostic[], success: false }
 *   | { error: CliParseError, success: false }
 * >}
 */
async function applyUpdateStoredQuery(
  config_file_path,
  raw_config,
  repo_config,
  stored_query_mutation,
) {
  const existing_query = repo_config.queries[stored_query_mutation.name];

  if (!existing_query) {
    return {
      error: createQueryMutationUnknownStoredQueryError(
        stored_query_mutation.name,
        Object.keys(repo_config.queries),
        'update',
      ),
      success: false,
    };
  }

  const next_name =
    stored_query_mutation.next_name ?? stored_query_mutation.name;

  if (
    next_name !== stored_query_mutation.name &&
    repo_config.queries[next_name]
  ) {
    return {
      error: {
        code: 'message',
        message: `Stored query already exists: ${next_name}.`,
      },
      success: false,
    };
  }

  const raw_queries = ensureRawQueries(raw_config);
  const raw_query_value = rawQueryValueToRecord(
    raw_queries[stored_query_mutation.name],
  );
  const next_query = createUpdatedStoredQueryDefinition(
    raw_query_value,
    existing_query,
    stored_query_mutation,
  );

  if (next_name !== stored_query_mutation.name) {
    delete raw_queries[stored_query_mutation.name];
  }

  raw_queries[next_name] = next_query;

  return persistStoredQueryMutation(config_file_path, raw_config, {
    action: 'updated',
    name: next_name,
    previous_name:
      next_name === stored_query_mutation.name
        ? undefined
        : stored_query_mutation.name,
  });
}

/**
 * @param {string} stored_query_name
 * @param {string[]} stored_query_names
 * @param {'remove' | 'update'} subcommand_name
 * @returns {CliParseError}
 */
function createQueryMutationUnknownStoredQueryError(
  stored_query_name,
  stored_query_names,
  subcommand_name,
) {
  const parse_error = createUnknownStoredQueryError(
    stored_query_name,
    stored_query_names,
  );

  if (
    parse_error.code !== 'unknown_stored_query' ||
    parse_error.suggestion === undefined
  ) {
    return parse_error;
  }

  return {
    ...parse_error,
    next_path: `patram queries ${subcommand_name} ${parse_error.suggestion}`,
  };
}
