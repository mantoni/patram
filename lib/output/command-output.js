/**
 * @import { ParsedCliArguments } from '../cli/arguments.types.ts';
 * @import { OutputView } from './output-view.types.ts';
 */

import process from 'node:process';

import { resolveOutputMode } from '../cli/resolve-output-mode.js';
import { renderOutputView } from './render-output-view.js';
import { writePagedOutput } from './write-paged-output.js';

/**
 * TTY and pager output control.
 *
 * Resolves the final output mode and switches between direct stdout writes and
 * interactive pager output.
 *
 * Kind: output
 * Status: active
 * Tracked in: ../../docs/plans/v0/source-anchor-dogfooding.md
 * Decided by: ../../docs/decisions/tty-pager-output.md
 * @patram
 * @see {@link ./render-output-view.js}
 * @see {@link ../../docs/decisions/tty-pager-output.md}
 */

/**
 * @param {{ stdout: { columns?: number, isTTY?: boolean, write(chunk: string): boolean }, write_paged_output?: (output_text: string) => Promise<void> }} io_context
 * @param {ParsedCliArguments} parsed_command
 * @param {OutputView} output_view
 * @returns {Promise<void>}
 */
export async function writeCommandOutput(
  io_context,
  parsed_command,
  output_view,
) {
  const rendered_output = await renderOutputView(
    output_view,
    resolveOutputMode(parsed_command, {
      is_tty: io_context.stdout.isTTY === true,
      no_color: process.env.NO_COLOR !== undefined,
      term: process.env.TERM,
    }),
    parsed_command,
    {
      is_tty: io_context.stdout.isTTY === true,
      terminal_width:
        io_context.stdout.isTTY === true
          ? io_context.stdout.columns
          : undefined,
    },
  );

  await writeRenderedCommandOutput(io_context, parsed_command, rendered_output);
}

/**
 * @param {{ stdout: { isTTY?: boolean, write(chunk: string): boolean }, write_paged_output?: (output_text: string) => Promise<void> }} io_context
 * @param {ParsedCliArguments} parsed_command
 * @param {string} rendered_output
 * @returns {Promise<void>}
 */
export async function writeRenderedCommandOutput(
  io_context,
  parsed_command,
  rendered_output,
) {
  if (shouldPageCommandOutput(parsed_command, io_context.stdout)) {
    await writeInteractiveOutput(io_context, rendered_output);

    return;
  }

  io_context.stdout.write(rendered_output);
}

/**
 * @param {ParsedCliArguments} parsed_command
 * @param {{ isTTY?: boolean }} output_stream
 * @returns {boolean}
 */
export function shouldPageCommandOutput(parsed_command, output_stream) {
  return (
    output_stream.isTTY === true &&
    (parsed_command.command_name === 'fields' ||
      parsed_command.command_name === 'query' ||
      parsed_command.command_name === 'refs' ||
      parsed_command.command_name === 'show')
  );
}

/**
 * @param {{ write_paged_output?: (output_text: string) => Promise<void> }} io_context
 * @param {string} rendered_output
 * @returns {Promise<void>}
 */
async function writeInteractiveOutput(io_context, rendered_output) {
  if (io_context.write_paged_output) {
    await io_context.write_paged_output(rendered_output);

    return;
  }

  await writePagedOutput(rendered_output);
}
