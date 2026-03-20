/**
 * @import { LoadPatramConfigResult, PatramDiagnostic, PatramRepoConfig } from './load-patram-config.types.ts';
 */

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import process from 'node:process';

import { z } from 'zod';

const CONFIG_FILE_NAME = '.patram.json';

const stored_query_schema = z
  .object({
    where: z.string().min(1, 'Stored query "where" must not be empty.'),
  })
  .strict();

const patram_repo_config_schema = z
  .object({
    include: z
      .array(z.string().min(1, 'Include globs must not be empty.'))
      .min(1, 'Include must contain at least one glob.'),
    queries: z.record(z.string().min(1), stored_query_schema),
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
    return createLoadResult(null, [createMissingConfigDiagnostic()]);
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

  return createLoadResult(config_result.data, []);
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
 * @returns {PatramDiagnostic}
 */
function createMissingConfigDiagnostic() {
  return {
    code: 'config.not_found',
    column: 1,
    level: 'error',
    line: 1,
    message: 'Config file ".patram.json" was not found.',
    path: CONFIG_FILE_NAME,
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
