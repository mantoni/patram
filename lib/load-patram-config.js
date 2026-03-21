/**
 * @import { LoadPatramConfigResult, PatramDiagnostic, PatramRepoConfig } from './load-patram-config.types.ts';
 */

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import process from 'node:process';

import { z } from 'zod';

import { parsePatramConfig } from './patram-config.js';
import { DEFAULT_INCLUDE_PATTERNS } from './source-file-defaults.js';

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
      .min(1, 'Include must contain at least one glob.')
      .default(DEFAULT_INCLUDE_PATTERNS),
    kinds: z.unknown().optional(),
    mappings: z.unknown().optional(),
    queries: z.record(z.string().min(1), stored_query_schema).default({}),
    relations: z.unknown().optional(),
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
    return createLoadResult(createDefaultRepoConfig(), []);
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

  const graph_schema_diagnostics = validateGraphSchema(config_result.data);

  if (graph_schema_diagnostics.length > 0) {
    return createLoadResult(null, graph_schema_diagnostics);
  }

  return createLoadResult(normalizeRepoConfig(config_result.data), []);
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
 * @param {{ include: string[], queries: Record<string, { where: string }>, kinds?: unknown, mappings?: unknown, relations?: unknown }} repo_config
 * @returns {PatramDiagnostic[]}
 */
function validateGraphSchema(repo_config) {
  if (
    repo_config.kinds === undefined &&
    repo_config.mappings === undefined &&
    repo_config.relations === undefined
  ) {
    return [];
  }

  try {
    parsePatramConfig({
      kinds: repo_config.kinds ?? {},
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
 * @returns {PatramRepoConfig}
 */
function createDefaultRepoConfig() {
  return {
    include: [...DEFAULT_INCLUDE_PATTERNS],
    queries: {},
  };
}

/**
 * @param {{ include: string[], queries: Record<string, { where: string }>, kinds?: unknown, mappings?: unknown, relations?: unknown }} repo_config
 * @returns {PatramRepoConfig}
 */
function normalizeRepoConfig(repo_config) {
  /** @type {PatramRepoConfig} */
  const normalized_config = {
    include: [...repo_config.include],
    queries: { ...repo_config.queries },
  };

  if (repo_config.kinds !== undefined && repo_config.kinds !== null) {
    normalized_config.kinds = /** @type {PatramRepoConfig['kinds']} */ (
      repo_config.kinds
    );
  }

  if (repo_config.mappings !== undefined && repo_config.mappings !== null) {
    normalized_config.mappings = /** @type {PatramRepoConfig['mappings']} */ (
      repo_config.mappings
    );
  }

  if (repo_config.relations !== undefined && repo_config.relations !== null) {
    normalized_config.relations = /** @type {PatramRepoConfig['relations']} */ (
      repo_config.relations
    );
  }

  return normalized_config;
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
