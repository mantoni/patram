/**
 * @import { ParsedCliCommandRequest } from '../arguments.types.ts';
 */

import process from 'node:process';

import { manageStoredQueries } from '../../config/manage-stored-queries.js';
import { loadPatramConfig } from '../../config/load-patram-config.js';
import { renderCheckDiagnostics } from '../../output/render-check-output.js';
import { writeCommandOutput } from '../../output/command-output.js';
import { listQueries } from '../../output/list-queries.js';
import { createOutputView } from '../../output/render-output-view.js';
import { renderCliParseError } from '../render-help.js';

import {
  resolveCommandOutputMode,
  writeDiagnostics,
} from '../command-helpers.js';

/**
 * @param {ParsedCliCommandRequest} parsed_command
 * @param {{ stderr: { write(chunk: string): boolean }, stdout: { isTTY?: boolean, write(chunk: string): boolean }, write_paged_output?: (output_text: string) => Promise<void> }} io_context
 * @returns {Promise<number>}
 */
export async function runQueriesCommand(parsed_command, io_context) {
  if (parsed_command.command_arguments.length > 0) {
    return runQueriesMutationCommand(parsed_command, io_context);
  }

  const load_result = await loadPatramConfig(process.cwd());

  if (load_result.diagnostics.length > 0) {
    writeDiagnostics(io_context.stderr, load_result.diagnostics);

    return 1;
  }

  const repo_config = load_result.config;

  if (!repo_config) {
    throw new Error('Expected a valid Patram repo config.');
  }

  await writeCommandOutput(
    io_context,
    parsed_command,
    createOutputView('queries', listQueries(repo_config.queries)),
  );

  return 0;
}

/**
 * @param {ParsedCliCommandRequest} parsed_command
 * @param {{ stderr: { write(chunk: string): boolean }, stdout: { isTTY?: boolean, write(chunk: string): boolean } }} io_context
 * @returns {Promise<number>}
 */
async function runQueriesMutationCommand(parsed_command, io_context) {
  const mutation_request = parseStoredQueryMutation(
    parsed_command.command_arguments,
  );
  const output_mode = resolveCommandOutputMode(parsed_command, io_context);

  if (!mutation_request.success) {
    io_context.stderr.write(renderCliParseError(mutation_request.error));

    return 1;
  }

  const mutation_result = await manageStoredQueries(
    process.cwd(),
    mutation_request.value,
  );

  if (!mutation_result.success) {
    if ('error' in mutation_result) {
      io_context.stderr.write(renderCliParseError(mutation_result.error));

      return 1;
    }

    io_context.stderr.write(
      renderCheckDiagnostics(mutation_result.diagnostics, output_mode),
    );

    return 1;
  }

  io_context.stdout.write(
    renderStoredQueryMutationResult(
      mutation_result.value,
      parsed_command.output_mode,
    ),
  );

  return 0;
}

/**
 * @param {string[]} command_arguments
 * @returns {{
 *   success: true,
 *   value:
 *     | {
 *         action: 'add',
 *         cypher?: string,
 *         description?: string,
 *         name: string,
 *         where?: string,
 *       }
 *     | { action: 'remove', name: string }
 *     | {
 *         action: 'update',
 *         cypher?: string,
 *         description?: string,
 *         name: string,
 *         next_name?: string,
 *         where?: string,
 *       },
 * } | { error: import('../arguments.types.ts').CliParseError, success: false }}
 */
function parseStoredQueryMutation(command_arguments) {
  const subcommand_name = command_arguments[0];

  if (subcommand_name === 'add') {
    return {
      success: true,
      value: {
        action: 'add',
        cypher: readOptionValue(command_arguments, '--cypher'),
        description: readOptionValue(command_arguments, '--desc'),
        name: command_arguments[1],
        where: readOptionValue(command_arguments, '--where'),
      },
    };
  }

  if (subcommand_name === 'remove') {
    return {
      success: true,
      value: {
        action: 'remove',
        name: command_arguments[1],
      },
    };
  }

  if (subcommand_name === 'update') {
    return {
      success: true,
      value: {
        action: 'update',
        cypher: readOptionValue(command_arguments, '--cypher'),
        description: readOptionValue(command_arguments, '--desc'),
        name: command_arguments[1],
        next_name: readOptionValue(command_arguments, '--name'),
        where: readOptionValue(command_arguments, '--where'),
      },
    };
  }

  return {
    error: {
      code: 'unexpected_argument',
      command_name: 'queries',
      token: subcommand_name ?? '',
    },
    success: false,
  };
}

/**
 * @param {{
 *   action: 'added',
 *   name: string,
 * } | {
 *   action: 'removed',
 *   name: string,
 * } | {
 *   action: 'updated',
 *   name: string,
 *   previous_name?: string,
 * }} mutation_result
 * @param {ParsedCliCommandRequest['output_mode']} output_mode
 * @returns {string}
 */
function renderStoredQueryMutationResult(mutation_result, output_mode) {
  if (output_mode === 'json') {
    return `${JSON.stringify(mutation_result, null, 2)}\n`;
  }

  if (
    mutation_result.action === 'updated' &&
    mutation_result.previous_name !== undefined
  ) {
    return `Updated stored query: ${mutation_result.previous_name} -> ${mutation_result.name}\n`;
  }

  if (mutation_result.action === 'updated') {
    return `Updated stored query: ${mutation_result.name}\n`;
  }

  if (mutation_result.action === 'added') {
    return `Added stored query: ${mutation_result.name}\n`;
  }

  return `Removed stored query: ${mutation_result.name}\n`;
}

/**
 * @param {string[]} command_arguments
 * @param {'--cypher' | '--desc' | '--name' | '--where'} option_name
 * @returns {string | undefined}
 */
function readOptionValue(command_arguments, option_name) {
  const option_index = command_arguments.indexOf(option_name);

  if (option_index < 0) {
    return undefined;
  }

  return command_arguments[option_index + 1];
}
