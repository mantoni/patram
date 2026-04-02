/**
 * @import {
 *   PatramDiagnostic,
 *   PatramRepoConfig,
 * } from './load-patram-config.types.ts';
 */

import { patram_repo_config_schema } from './schema.js';
import { normalizeRepoConfig } from './defaults.js';
import {
  validateFieldSchemaConfig,
  validateGraphSchema,
  validateLegacyConfigShape,
  validateStoredQueries,
} from './validation.js';

/**
 * @param {unknown} config_value
 * @returns {{ config: PatramRepoConfig, success: true } | { diagnostics: PatramDiagnostic[], success: false }}
 */
export function validatePatramConfigValue(config_value) {
  const legacy_config_diagnostics = validateLegacyConfigShape(config_value);

  if (legacy_config_diagnostics.length > 0) {
    return {
      diagnostics: legacy_config_diagnostics,
      success: false,
    };
  }

  const config_result = patram_repo_config_schema.safeParse(config_value);

  if (!config_result.success) {
    return {
      diagnostics: config_result.error.issues.map(createValidationDiagnostic),
      success: false,
    };
  }

  const graph_schema_diagnostics = validateGraphSchema(config_result.data);

  if (graph_schema_diagnostics.length > 0) {
    return {
      diagnostics: graph_schema_diagnostics,
      success: false,
    };
  }

  const normalized_config = normalizeRepoConfig(config_result.data);
  const field_schema_diagnostics = validateFieldSchemaConfig(normalized_config);

  if (field_schema_diagnostics.length > 0) {
    return {
      diagnostics: field_schema_diagnostics,
      success: false,
    };
  }

  const stored_query_diagnostics = validateStoredQueries(normalized_config);

  if (stored_query_diagnostics.length > 0) {
    return {
      diagnostics: stored_query_diagnostics,
      success: false,
    };
  }

  return {
    config: normalized_config,
    success: true,
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
      path: '.patram.json',
    };
  }

  return {
    code: 'config.invalid',
    column: 1,
    level: 'error',
    line: 1,
    message: `Invalid config: ${issue.message}`,
    path: '.patram.json',
  };
}

/**
 * @param {(string | number | symbol | undefined)[]} issue_path
 * @returns {string}
 */
function formatIssuePath(issue_path) {
  return issue_path.map(String).join('.');
}
