/**
 * @import { BuildGraphResult } from './build-graph.types.ts';
 * @import { PatramClaim } from './parse-claims.types.ts';
 * @import { PatramDiagnostic, PatramRepoConfig } from './load-patram-config.types.ts';
 */

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { buildGraph } from './build-graph.js';
import { listSourceFiles } from './list-source-files.js';
import { loadPatramConfig } from './load-patram-config.js';
import { parseClaims } from './parse-claims.js';
import { resolvePatramGraphConfig } from './resolve-patram-graph-config.js';

/**
 * Load config, source files, claims, and the materialized graph for one
 * project directory.
 *
 * @param {string} project_directory
 * @returns {Promise<{ config: PatramRepoConfig, diagnostics: PatramDiagnostic[], graph: BuildGraphResult, source_file_paths: string[] }>}
 */
export async function loadProjectGraph(project_directory) {
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
