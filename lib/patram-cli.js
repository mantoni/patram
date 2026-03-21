/**
 * @import { ParsedCliArguments } from './parse-cli-arguments.types.ts';
 */

import process from 'node:process';

import { checkGraph } from './check-graph.js';
import { listQueries } from './list-queries.js';
import { loadPatramConfig } from './load-patram-config.js';
import { loadProjectGraph } from './load-project-graph.js';
import { parseCliArguments } from './parse-cli-arguments.js';
import { queryGraph } from './query-graph.js';
import {
  renderCheckDiagnostics,
  renderCheckSuccess,
} from './render-check-output.js';
import {
  createOutputView,
  createShowOutputView,
  renderOutputView,
} from './render-output-view.js';
import { resolveWhereClause } from './resolve-where-clause.js';
import { resolveOutputMode } from './resolve-output-mode.js';
import { loadShowOutput } from './show-document.js';

/**
 * Run the Patram CLI.
 *
 * @param {string[]} cli_arguments
 * @param {{ stderr: { write(chunk: string): boolean }, stdout: { isTTY?: boolean, write(chunk: string): boolean } }} io_context
 * @returns {Promise<number>}
 */
export async function main(cli_arguments, io_context) {
  const parsed_arguments = parseCliArguments(cli_arguments);

  if (!parsed_arguments.success) {
    io_context.stderr.write(`${parsed_arguments.message}\n`);

    return 1;
  }

  const parsed_command = parsed_arguments.value;

  if (parsed_command.command_name === 'check') {
    return runCheckCommand(parsed_command, io_context);
  }

  if (parsed_command.command_name === 'query') {
    return runQueryCommand(parsed_command, io_context);
  }

  if (parsed_command.command_name === 'queries') {
    return runQueriesCommand(parsed_command, io_context);
  }

  if (parsed_command.command_name === 'show') {
    return runShowCommand(parsed_command, io_context);
  }

  io_context.stderr.write('Unknown command.\n');

  return 1;
}

/**
 * @param {ParsedCliArguments} parsed_command
 * @param {{ stderr: { write(chunk: string): boolean }, stdout: { isTTY?: boolean, write(chunk: string): boolean } }} io_context
 * @returns {Promise<number>}
 */
async function runCheckCommand(parsed_command, io_context) {
  const output_mode = resolveOutputMode(parsed_command, {
    is_tty: io_context.stdout.isTTY === true,
    no_color: process.env.NO_COLOR !== undefined,
    term: process.env.TERM,
  });
  const project_directory =
    parsed_command.command_arguments[0] ?? process.cwd();
  const project_graph_result = await loadProjectGraph(project_directory);

  if (project_graph_result.diagnostics.length > 0) {
    io_context.stderr.write(
      renderCheckDiagnostics(project_graph_result.diagnostics, output_mode),
    );

    return 1;
  }

  const diagnostics = checkGraph(
    project_graph_result.graph,
    project_graph_result.source_file_paths,
  );

  if (diagnostics.length > 0) {
    io_context.stderr.write(renderCheckDiagnostics(diagnostics, output_mode));

    return 1;
  }

  io_context.stdout.write(
    renderCheckSuccess(
      project_graph_result.source_file_paths.length,
      output_mode,
    ),
  );

  return 0;
}

/**
 * @param {ParsedCliArguments} parsed_command
 * @param {{ stderr: { write(chunk: string): boolean }, stdout: { isTTY?: boolean, write(chunk: string): boolean } }} io_context
 * @returns {Promise<number>}
 */
async function runQueryCommand(parsed_command, io_context) {
  const project_graph_result = await loadProjectGraph(process.cwd());

  if (project_graph_result.diagnostics.length > 0) {
    writeDiagnostics(io_context.stderr, project_graph_result.diagnostics);

    return 1;
  }

  const where_clause = resolveWhereClause(
    project_graph_result.config,
    parsed_command.command_arguments,
  );

  if (!where_clause.success) {
    io_context.stderr.write(`${where_clause.message}\n`);

    return 1;
  }

  const query_result = queryGraph(
    project_graph_result.graph,
    where_clause.value,
  );

  if (query_result.diagnostics.length > 0) {
    writeDiagnostics(io_context.stderr, query_result.diagnostics);

    return 1;
  }

  writeCommandOutput(
    io_context.stdout,
    parsed_command,
    createOutputView('query', query_result.nodes),
  );

  return 0;
}

/**
 * @param {ParsedCliArguments} parsed_command
 * @param {{ stderr: { write(chunk: string): boolean }, stdout: { isTTY?: boolean, write(chunk: string): boolean } }} io_context
 * @returns {Promise<number>}
 */
async function runQueriesCommand(parsed_command, io_context) {
  const load_result = await loadPatramConfig(process.cwd());

  if (load_result.diagnostics.length > 0) {
    writeDiagnostics(io_context.stderr, load_result.diagnostics);

    return 1;
  }

  const repo_config = load_result.config;

  if (!repo_config) {
    throw new Error('Expected a valid Patram repo config.');
  }

  writeCommandOutput(
    io_context.stdout,
    parsed_command,
    createOutputView('queries', listQueries(repo_config.queries)),
  );

  return 0;
}

/**
 * @param {ParsedCliArguments} parsed_command
 * @param {{ stderr: { write(chunk: string): boolean }, stdout: { isTTY?: boolean, write(chunk: string): boolean } }} io_context
 * @returns {Promise<number>}
 */
async function runShowCommand(parsed_command, io_context) {
  const project_graph_result = await loadProjectGraph(process.cwd());

  if (project_graph_result.diagnostics.length > 0) {
    writeDiagnostics(io_context.stderr, project_graph_result.diagnostics);

    return 1;
  }

  const show_output = await loadShowOutput(
    parsed_command.command_arguments[0],
    process.cwd(),
    project_graph_result.graph,
  );

  if (!show_output.success) {
    writeDiagnostics(io_context.stderr, [show_output.diagnostic]);

    return 1;
  }

  writeCommandOutput(
    io_context.stdout,
    parsed_command,
    createShowOutputView(show_output.value),
  );

  return 0;
}

/**
 * @param {{ write(chunk: string): boolean }} output_stream
 * @param {import('./load-patram-config.types.ts').PatramDiagnostic[]} diagnostics
 */
function writeDiagnostics(output_stream, diagnostics) {
  for (const diagnostic of diagnostics) {
    output_stream.write(formatDiagnostic(diagnostic));
  }
}

/**
 * @param {{ isTTY?: boolean, write(chunk: string): boolean }} output_stream
 * @param {ParsedCliArguments} parsed_command
 * @param {import('./output-view.types.ts').OutputView} output_view
 */
function writeCommandOutput(output_stream, parsed_command, output_view) {
  output_stream.write(
    renderOutputView(
      output_view,
      resolveOutputMode(parsed_command, {
        is_tty: output_stream.isTTY === true,
        no_color: process.env.NO_COLOR !== undefined,
        term: process.env.TERM,
      }),
      parsed_command,
    ),
  );
}

/**
 * @param {import('./load-patram-config.types.ts').PatramDiagnostic} diagnostic
 * @returns {string}
 */
function formatDiagnostic(diagnostic) {
  return `${diagnostic.path}:${diagnostic.line}:${diagnostic.column} ${diagnostic.level} ${diagnostic.code} ${diagnostic.message}\n`;
}
