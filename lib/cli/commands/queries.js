/**
 * @import { ParsedCliCommandRequest } from '../arguments.types.ts';
 */

import process from 'node:process';

import { loadPatramConfig } from '../../config/load-patram-config.js';
import { writeCommandOutput } from '../../output/command-output.js';
import { listQueries } from '../../output/list-queries.js';
import { createOutputView } from '../../output/render-output-view.js';

import { writeDiagnostics } from '../command-helpers.js';

/**
 * @param {ParsedCliCommandRequest} parsed_command
 * @param {{ stderr: { write(chunk: string): boolean }, stdout: { isTTY?: boolean, write(chunk: string): boolean }, write_paged_output?: (output_text: string) => Promise<void> }} io_context
 * @returns {Promise<number>}
 */
export async function runQueriesCommand(parsed_command, io_context) {
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
