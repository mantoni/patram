/**
 * @import {
 *   ClassFieldRuleConfig,
 *   ClassSchemaConfig,
 *   DerivedSummaryConfig,
 *   DerivedSummaryFieldConfig,
 *   DerivedSummaryScalar,
 *   DerivedSummarySelectCaseConfig,
 *   FieldDisplayConfig,
 *   FieldQueryConfig,
 *   MetadataFieldConfig,
 *   PathClassConfig,
 *   StoredQueryConfig,
 * } from './schema.js';
 */

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import process from 'node:process';

import { CONFIG_FILE_NAME, patram_repo_config_schema } from './schema.js';
import { createDefaultRepoConfig, normalizeRepoConfig } from './defaults.js';
import {
  validateDerivedSummaries,
  validateFieldSchemaConfig,
  validateGraphSchema,
  validateLegacyConfigShape,
  validateStoredQueries,
} from './validation.js';

/**
 * Repo config loading.
 *
 * Reads `.patram.json`, applies defaults, and validates repo config and graph
 * schema before command execution.
 *
 * Kind: config
 * Status: active
 * Tracked in: ../../docs/plans/v0/source-anchor-dogfooding.md
 * Decided by: ../../docs/decisions/single-config-file.md
 * Decided by: ../../docs/decisions/optional-config-default-scan.md
 * @patram
 * @see {@link ./schema.js}
 * @see {@link ./validation.js}
 */

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
 * @typedef {object} LoadPatramConfigResult
 * @property {import('./schema.js').PatramRepoConfig | null} config
 * @property {string} config_path
 * @property {PatramDiagnostic[]} diagnostics
 */

/**
 * @typedef {import('./schema.js').StoredQueryConfig} StoredQueryConfig
 * @typedef {import('./schema.js').FieldDisplayConfig} FieldDisplayConfig
 * @typedef {import('./schema.js').FieldQueryConfig} FieldQueryConfig
 * @typedef {import('./schema.js').MetadataFieldConfig} MetadataFieldConfig
 * @typedef {import('./schema.js').ClassFieldRuleConfig} ClassFieldRuleConfig
 * @typedef {import('./schema.js').ClassSchemaConfig} ClassSchemaConfig
 * @typedef {import('./schema.js').PathClassConfig} PathClassConfig
 * @typedef {import('./schema.js').DerivedSummaryScalar} DerivedSummaryScalar
 * @typedef {import('./schema.js').DerivedSummarySelectCaseConfig} DerivedSummarySelectCaseConfig
 * @typedef {import('./schema.js').DerivedSummaryFieldConfig} DerivedSummaryFieldConfig
 * @typedef {import('./schema.js').DerivedSummaryConfig} DerivedSummaryConfig
 * @typedef {import('./schema.js').PatramRepoConfig} PatramRepoConfig
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

  const legacy_config_diagnostics = validateLegacyConfigShape(
    parse_result.value,
  );

  if (legacy_config_diagnostics.length > 0) {
    return createLoadResult(null, legacy_config_diagnostics);
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
 * @param {import('./schema.js').PatramRepoConfig | null} config
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
