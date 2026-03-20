#!/usr/bin/env node

/**
 * @import { BuildGraphResult, GraphNode } from '../lib/build-graph.types.ts';
 * @import { PatramClaim } from '../lib/parse-claims.types.ts';
 * @import { PatramDiagnostic } from '../lib/load-patram-config.types.ts';
 */

import { readFile, realpath } from 'node:fs/promises';
import { resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { buildGraph } from '../lib/build-graph.js';
import { checkGraph } from '../lib/check-graph.js';
import { listSourceFiles } from '../lib/list-source-files.js';
import { loadPatramConfig } from '../lib/load-patram-config.js';
import { parseClaims } from '../lib/parse-claims.js';
import { queryGraph } from '../lib/query-graph.js';
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
 * @param {{ stderr: { write(chunk: string): boolean }, stdout: { write(chunk: string): boolean } }} io_context
 * @returns {Promise<number>}
 */
export async function main(cli_arguments, io_context) {
  const command_name = cli_arguments[0];

  if (command_name === 'check') {
    return runCheckCommand(cli_arguments.slice(1), io_context);
  }

  if (command_name === 'query') {
    return runQueryCommand(cli_arguments.slice(1), io_context);
  }

  io_context.stderr.write('Unknown command.\n');

  return 1;
}

/**
 * @param {string[]} command_arguments
 * @param {{ stderr: { write(chunk: string): boolean }, stdout: { write(chunk: string): boolean } }} io_context
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
 * @param {string[]} command_arguments
 * @param {{ stderr: { write(chunk: string): boolean }, stdout: { write(chunk: string): boolean } }} io_context
 * @returns {Promise<number>}
 */
async function runQueryCommand(command_arguments, io_context) {
  if (command_arguments[0] !== '--where') {
    io_context.stderr.write('Query requires "--where".\n');

    return 1;
  }

  const where_clause = command_arguments.slice(1).join(' ').trim();

  if (where_clause.length === 0) {
    io_context.stderr.write('Query requires a where clause.\n');

    return 1;
  }

  const project_graph_result = await loadProjectGraph(process.cwd());

  if (project_graph_result.diagnostics.length > 0) {
    writeDiagnostics(io_context.stderr, project_graph_result.diagnostics);

    return 1;
  }

  const query_result = queryGraph(project_graph_result.graph, where_clause);

  if (query_result.diagnostics.length > 0) {
    writeDiagnostics(io_context.stderr, query_result.diagnostics);

    return 1;
  }

  writeQueryResults(io_context.stdout, query_result.nodes);

  return 0;
}

/**
 * @param {string} project_directory
 * @returns {Promise<{ diagnostics: PatramDiagnostic[], graph: BuildGraphResult, source_file_paths: string[] }>}
 */
async function loadProjectGraph(project_directory) {
  const load_result = await loadPatramConfig(project_directory);

  if (load_result.diagnostics.length > 0) {
    return {
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
 * @param {{ write(chunk: string): boolean }} output_stream
 * @param {GraphNode[]} graph_nodes
 */
function writeQueryResults(output_stream, graph_nodes) {
  for (const graph_node of graph_nodes) {
    output_stream.write(formatQueryResult(graph_node));
  }
}

/**
 * @param {import('../lib/load-patram-config.types.ts').PatramDiagnostic} diagnostic
 * @returns {string}
 */
function formatDiagnostic(diagnostic) {
  return `${diagnostic.path}:${diagnostic.line}:${diagnostic.column} ${diagnostic.level} ${diagnostic.code} ${diagnostic.message}\n`;
}

/**
 * @param {GraphNode} graph_node
 * @returns {string}
 */
function formatQueryResult(graph_node) {
  const label =
    graph_node.title ?? graph_node.label ?? graph_node.path ?? graph_node.key;

  if (!label) {
    throw new Error(
      `Expected graph node "${graph_node.id}" to have a display label.`,
    );
  }

  return `${graph_node.id} ${graph_node.kind} ${label}\n`;
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
