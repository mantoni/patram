/**
 * @typedef {import('./parse-cli-arguments-helpers.js').CliOptionValues} CliOptionValues
 * @typedef {import('./parse-cli-arguments-helpers.js').ParsedCommandLine} ParsedCommandLine
 * @typedef {import('./parse-cli-arguments.types.ts').ParseCliArgumentsResult} ParseCliArgumentsResult
 */

import { parseArgs } from 'node:util';

import {
  CLI_OPTIONS,
  buildCommandArguments,
  collectOptionTokens,
  createParseError,
  isCommandName,
  resolveOutputMode,
  validateParsedCommand,
} from './parse-cli-arguments-helpers.js';
import { resolveColorMode } from './parse-cli-color-options.js';
import { buildQueryPagination } from './parse-cli-query-pagination.js';

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

  const command_name = command_line.value.positionals[0];

  if (!isCommandName(command_name)) {
    return createParseError('Unknown command.');
  }

  const validation_message = validateParsedCommand(
    command_name,
    command_line.value,
  );

  if (validation_message) {
    return createParseError(validation_message);
  }

  const command_positionals = command_line.value.positionals.slice(1);

  return {
    success: true,
    value: {
      color_mode: resolveColorMode(command_line.value.option_tokens),
      command_arguments: buildCommandArguments(
        command_name,
        command_positionals,
        command_line.value.values,
      ),
      command_name,
      output_mode: resolveOutputMode(command_line.value.values),
      ...buildQueryPagination(command_line.value.values),
    },
  };
}

/**
 * @param {string[]} cli_arguments
 * @returns {{ success: true, value: ParsedCommandLine } | { message: string, success: false }}
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
      return createParseError(error.message);
    }

    throw error;
  }
}
