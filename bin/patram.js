#!/usr/bin/env node

/**
 * @import { PatramClaim } from '../lib/parse-claims.types.ts';
 */

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

import { buildGraph } from '../lib/build-graph.js';
import { checkGraph } from '../lib/check-graph.js';
import { listSourceFiles } from '../lib/list-source-files.js';
import { loadPatramConfig } from '../lib/load-patram-config.js';
import { parseClaims } from '../lib/parse-claims.js';
import { parsePatramConfig } from '../lib/patram-config.js';

const CHECK_GRAPH_CONFIG = parsePatramConfig({
  kinds: {
    document: {
      builtin: true,
      label: 'Document',
    },
  },
  mappings: {
    'document.title': {
      node: {
        field: 'title',
        kind: 'document',
      },
    },
    'markdown.link': {
      emit: {
        relation: 'links_to',
        target: 'path',
        target_kind: 'document',
      },
    },
  },
  relations: {
    links_to: {
      builtin: true,
      from: ['document'],
      to: ['document'],
    },
  },
});

if (isEntrypoint(import.meta.url, process.argv[1])) {
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
  const load_result = await loadPatramConfig(project_directory);

  if (load_result.diagnostics.length > 0) {
    writeDiagnostics(io_context.stderr, load_result.diagnostics);

    return 1;
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
  const graph = buildGraph(CHECK_GRAPH_CONFIG, claims);
  const diagnostics = checkGraph(graph, source_file_paths);

  if (diagnostics.length > 0) {
    writeDiagnostics(io_context.stderr, diagnostics);

    return 1;
  }

  return 0;
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
 * @param {import('../lib/load-patram-config.types.ts').PatramDiagnostic} diagnostic
 * @returns {string}
 */
function formatDiagnostic(diagnostic) {
  return `${diagnostic.path}:${diagnostic.line}:${diagnostic.column} ${diagnostic.level} ${diagnostic.code} ${diagnostic.message}\n`;
}

/**
 * @param {string} module_url
 * @param {string | undefined} process_entry_path
 * @returns {boolean}
 */
function isEntrypoint(module_url, process_entry_path) {
  if (!process_entry_path) {
    return false;
  }

  return module_url === pathToFileURL(process_entry_path).href;
}
