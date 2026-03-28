/* eslint-disable max-lines-per-function */
/**
 * @typedef {import('./parse-arguments-helpers.js').CliOptionValues} CliOptionValues
 * @typedef {import('./parse-arguments-helpers.js').ParsedCommandLine} ParsedCommandLine
 * @typedef {import('./arguments.types.ts').CliParseError} CliParseError
 * @typedef {import('./arguments.types.ts').ParseCliArgumentsResult} ParseCliArgumentsResult
 */

import { parseArgs } from 'node:util';

import {
  CLI_OPTIONS,
  buildCommandArguments,
  collectOptionTokens,
  createCommandHelpRequest,
  createMessageParseError,
  createNamedHelpRequest,
  createRootHelpRequest,
  createUnknownCommandError,
  createUnknownHelpTargetError,
  resolveOutputMode,
  validateCommandLineBeforeHelp,
  validateHelpCommandLine,
  validateParsedCommand,
  validateRootCommandLine,
} from './parse-arguments-helpers.js';
import { isCommandName } from './help-metadata.js';
import { resolveColorMode } from './color-options.js';
import { buildQueryPagination } from './query-pagination.js';

/**
 * CLI argument parsing.
 *
 * Normalizes raw argv into one validated Patram command plus shared output and
 * pagination options.
 *
 * Kind: cli
 * Status: active
 * Tracked in: ../../docs/plans/v0/source-anchor-dogfooding.md
 * Decided by: ../../docs/decisions/cli-argument-parser.md
 * @patram
 * @see {@link ./main.js}
 * @see {@link ../../docs/decisions/cli-argument-parser.md}
 */

/**
 * Parse the CLI arguments into one validated command result.
 *
 * @param {string[]} cli_arguments
 * @returns {ParseCliArgumentsResult}
 */
export function parseCliArguments(cli_arguments) {
  const command_line = parseCommandLine(cli_arguments);

  if (!command_line.success) {
    return command_line;
  }

  const root_request = resolveRootHelpRequest(command_line.value);

  if (root_request) {
    return root_request;
  }

  const help_request = resolveNamedHelpRequest(command_line.value);

  if (help_request) {
    return help_request;
  }

  const command_name = command_line.value.positionals[0];

  if (!isCommandName(command_name)) {
    return {
      error: createUnknownCommandError(command_name),
      success: false,
    };
  }

  const pre_help_error = validateCommandLineBeforeHelp(
    command_name,
    command_line.value,
  );

  if (pre_help_error) {
    return {
      error: pre_help_error,
      success: false,
    };
  }

  if (command_line.value.values.help) {
    return {
      success: true,
      value: createCommandHelpRequest(command_name),
    };
  }

  const validation_error = validateParsedCommand(
    command_name,
    command_line.value,
  );

  if (validation_error) {
    return {
      error: validation_error,
      success: false,
    };
  }

  const command_positionals = command_line.value.positionals.slice(1);

  return {
    success: true,
    value: {
      kind: 'command',
      color_mode: resolveColorMode(command_line.value.option_tokens),
      command_arguments: buildCommandArguments(
        command_name,
        command_positionals,
        command_line.value.values,
      ),
      command_name,
      output_mode: resolveOutputMode(command_line.value.values),
      ...buildQueryInspection(command_line.value),
      ...buildQueryPagination(command_line.value.values),
    },
  };
}

/**
 * @param {string[]} cli_arguments
 * @returns {{ success: true, value: ParsedCommandLine } | { error: CliParseError, success: false }}
 */
function parseCommandLine(cli_arguments) {
  try {
    const parsed_arguments = parseArgs({
      allowPositionals: true,
      args: cli_arguments,
      options: CLI_OPTIONS,
      strict: false,
      tokens: true,
    });
    const parsed_values = /** @type {CliOptionValues} */ (
      parsed_arguments.values
    );

    return {
      success: true,
      value: {
        option_tokens: collectOptionTokens(parsed_arguments.tokens ?? []),
        positionals: parsed_arguments.positionals,
        values: parsed_values,
      },
    };
  } catch (error) {
    if (error instanceof Error) {
      return {
        error: /** @type {CliParseError} */ (
          createMessageParseError(error.message)
        ),
        success: false,
      };
    }

    throw error;
  }
}

/**
 * @param {ParsedCommandLine} command_line
 * @returns {ParseCliArgumentsResult | null}
 */
function resolveNamedHelpRequest(command_line) {
  if (command_line.positionals[0] !== 'help') {
    return null;
  }

  const validation_error = validateHelpCommandLine(command_line);

  if (validation_error) {
    return {
      error: validation_error,
      success: false,
    };
  }

  const help_target = command_line.positionals[1];

  if (!help_target) {
    return {
      success: true,
      value: createRootHelpRequest(),
    };
  }

  const help_request = createNamedHelpRequest(help_target);

  if (help_request) {
    return {
      success: true,
      value: help_request,
    };
  }

  return {
    error: createUnknownHelpTargetError(help_target),
    success: false,
  };
}

/**
 * @param {ParsedCommandLine} command_line
 * @returns {ParseCliArgumentsResult | null}
 */
function resolveRootHelpRequest(command_line) {
  if (command_line.positionals.length > 0) {
    return null;
  }

  const validation_error = validateRootCommandLine(command_line);

  if (validation_error) {
    return {
      error: validation_error,
      success: false,
    };
  }

  return {
    success: true,
    value: createRootHelpRequest(),
  };
}

/**
 * @param {ParsedCommandLine} command_line
 * @returns {'explain' | 'lint' | undefined}
 */
function resolveQueryInspectionMode(command_line) {
  if (command_line.values.explain) {
    return 'explain';
  }

  if (command_line.values.lint) {
    return 'lint';
  }

  return undefined;
}

/**
 * @param {ParsedCommandLine} command_line
 * @returns {{ query_inspection_mode?: 'explain' | 'lint' }}
 */
function buildQueryInspection(command_line) {
  const query_inspection_mode = resolveQueryInspectionMode(command_line);

  if (!query_inspection_mode) {
    return {};
  }

  return {
    query_inspection_mode,
  };
}
