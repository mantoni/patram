#!/usr/bin/env node

/**
 * @import { BuildGraphResult } from '../lib/build-graph.types.ts';
 * @import { PatramClaim } from '../lib/parse-claims.types.ts';
 * @import { ParsedCliArguments } from '../lib/parse-cli-arguments.types.ts';
 * @import { PatramDiagnostic, PatramRepoConfig } from '../lib/load-patram-config.types.ts';
 */

import { readFile, realpath } from 'node:fs/promises';
import { resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { buildGraph } from '../lib/build-graph.js';
import { checkGraph } from '../lib/check-graph.js';
import { listQueries } from '../lib/list-queries.js';
import { listSourceFiles } from '../lib/list-source-files.js';
import { loadPatramConfig } from '../lib/load-patram-config.js';
import { parseClaims } from '../lib/parse-claims.js';
import { parseCliArguments } from '../lib/parse-cli-arguments.js';
import { queryGraph } from '../lib/query-graph.js';
import {
  renderOutputView,
  createOutputView,
} from '../lib/render-output-view.js';
import { resolveWhereClause } from '../lib/resolve-where-clause.js';
import { resolveOutputMode } from '../lib/resolve-output-mode.js';
import { resolvePatramGraphConfig } from '../lib/resolve-patram-graph-config.js';

if (await isEntrypoint(import.meta.url, process.argv[1])) {
  process.exitCode = await main(process.argv.slice(2), {
    stderr: process.stderr,
    stdout: process.stdout,
  });
}

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
    return runCheckCommand(parsed_command.command_arguments, io_context);
  }

  if (parsed_command.command_name === 'query') {
    return runQueryCommand(parsed_command, io_context);
  }

  if (parsed_command.command_name === 'queries') {
    return runQueriesCommand(parsed_command, io_context);
  }

  io_context.stderr.write('Unknown command.\n');

  return 1;
}

/**
 * @param {string[]} command_arguments
 * @param {{ stderr: { write(chunk: string): boolean }, stdout: { isTTY?: boolean, write(chunk: string): boolean } }} io_context
 * @returns {Promise<number>}
 */
async function runCheckCommand(command_arguments, io_context) {
  const project_directory = command_arguments[0] ?? process.cwd();
  const project_graph_result = await loadProjectGraph(project_directory);

  if (project_graph_result.diagnostics.length > 0) {
    writeDiagnostics(io_context.stderr, project_graph_result.diagnostics);

    return 1;
  }

  const diagnostics = checkGraph(
    project_graph_result.graph,
    project_graph_result.source_file_paths,
  );

  if (diagnostics.length > 0) {
    writeDiagnostics(io_context.stderr, diagnostics);

    return 1;
  }

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
 * @param {string} project_directory
 * @returns {Promise<{ config: PatramRepoConfig, diagnostics: PatramDiagnostic[], graph: BuildGraphResult, source_file_paths: string[] }>}
 */
async function loadProjectGraph(project_directory) {
  const load_result = await loadPatramConfig(project_directory);

  if (load_result.diagnostics.length > 0) {
    return {
      config: {
        include: [],
        queries: {},
      },
      diagnostics: load_result.diagnostics,
      graph: {
        edges: [],
        nodes: {},
      },
      source_file_paths: [],
    };
  }

  const repo_config = load_result.config;

  if (!repo_config) {
    throw new Error('Expected a valid Patram repo config.');
  }

  const source_file_paths = await listSourceFiles(
    repo_config.include,
    project_directory,
  );
  const claims = await collectClaims(source_file_paths, project_directory);
  const graph_config = resolvePatramGraphConfig(repo_config);

  return {
    config: repo_config,
    diagnostics: [],
    graph: buildGraph(graph_config, claims),
    source_file_paths,
  };
}

/**
 * @param {string[]} source_file_paths
 * @param {string} project_directory
 * @returns {Promise<PatramClaim[]>}
 */
async function collectClaims(source_file_paths, project_directory) {
  /** @type {PatramClaim[]} */
  const claims = [];

  for (const source_file_path of source_file_paths) {
    const source_text = await readFile(
      resolve(project_directory, source_file_path),
      'utf8',
    );

    claims.push(
      ...parseClaims({
        path: source_file_path,
        source: source_text,
      }),
    );
  }

  return claims;
}

/**
 * @param {{ write(chunk: string): boolean }} output_stream
 * @param {import('../lib/load-patram-config.types.ts').PatramDiagnostic[]} diagnostics
 */
function writeDiagnostics(output_stream, diagnostics) {
  for (const diagnostic of diagnostics) {
    output_stream.write(formatDiagnostic(diagnostic));
  }
}

/**
 * @param {{ isTTY?: boolean, write(chunk: string): boolean }} output_stream
 * @param {ParsedCliArguments} parsed_command
 * @param {import('../lib/output-view.types.ts').OutputView} output_view
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
 * @param {string} module_url
 * @param {string | undefined} process_entry_path
 * @returns {Promise<boolean>}
 */
async function isEntrypoint(module_url, process_entry_path) {
  if (!process_entry_path) {
    return false;
  }

  const module_path = await realpath(fileURLToPath(module_url));
  const entry_path = await realpath(process_entry_path);

  return module_path === entry_path;
}

/**
 * @param {import('../lib/load-patram-config.types.ts').PatramDiagnostic} diagnostic
 * @returns {string}
 */
function formatDiagnostic(diagnostic) {
  return `${diagnostic.path}:${diagnostic.line}:${diagnostic.column} ${diagnostic.level} ${diagnostic.code} ${diagnostic.message}\n`;
}
