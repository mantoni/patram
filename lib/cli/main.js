/**
 * @import { ParsedCliCommandRequest } from './arguments.types.ts';
 */
import { renderCliParseError, renderHelpRequest } from './render-help.js';
import { parseCliArguments } from './parse-arguments.js';
import { runCheckCommand } from './commands/check.js';
import { runFieldsCommand } from './commands/fields.js';
import { runQueryCommand } from './commands/query.js';
import { runQueriesCommand } from './commands/queries.js';
import { runRefsCommand } from './commands/refs.js';
import { runShowCommand } from './commands/show.js';

/**
 * Patram command execution flow.
 *
 * Loads repo state and routes `check`, `fields`, `query`, `queries`, and
 * `show` through the shared output pipeline.
 *
 * Kind: cli
 * Status: active
 * Implements Command: ../../docs/reference/commands/check.md
 * Implements Command: ../../docs/reference/commands/query.md
 * Implements Command: ../../docs/reference/commands/queries.md
 * Implements Command: ../../docs/reference/commands/refs.md
 * Implements Command: ../../docs/reference/commands/show.md
 * Tracked in: ../../docs/plans/v0/source-anchor-dogfooding.md
 * Decided by: ../../docs/decisions/cli-output-architecture.md
 * Decided by: ../../docs/decisions/cli-argument-parser.md
 * @patram
 * @see {@link ./parse-arguments.js}
 * @see {@link ./commands/query.js}
 */

/**
 * Run the Patram CLI.
 *
 * @param {string[]} cli_arguments
 * @param {{ stderr: { write(chunk: string): boolean }, stdout: { isTTY?: boolean, write(chunk: string): boolean }, write_paged_output?: (output_text: string) => Promise<void> }} io_context
 * @returns {Promise<number>}
 */
export async function main(cli_arguments, io_context) {
  const parsed_arguments = parseCliArguments(cli_arguments);

  if (!parsed_arguments.success) {
    io_context.stderr.write(renderCliParseError(parsed_arguments.error));

    return 1;
  }

  if (parsed_arguments.value.kind === 'help') {
    io_context.stdout.write(renderHelpRequest(parsed_arguments.value));

    return 0;
  }

  const parsed_command = /** @type {ParsedCliCommandRequest} */ (
    parsed_arguments.value
  );
  const commandHandler = COMMAND_HANDLERS[parsed_command.command_name];

  if (commandHandler) {
    return commandHandler(parsed_command, io_context);
  }

  io_context.stderr.write('Unknown command.\n');

  return 1;
}
const COMMAND_HANDLERS = {
  check: runCheckCommand,
  fields: runFieldsCommand,
  queries: runQueriesCommand,
  query: runQueryCommand,
  refs: runRefsCommand,
  show: runShowCommand,
};
