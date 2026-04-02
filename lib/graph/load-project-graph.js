/**
 * @import { BuildGraphResult } from './build-graph.types.ts';
 * @import { PatramClaim } from '../parse/parse-claims.types.ts';
 * @import { PatramDiagnostic, PatramRepoConfig } from '../config/load-patram-config.types.ts';
 */

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { buildGraph } from './build-graph.js';
import { loadPatramConfig } from '../config/load-patram-config.js';
import { createParseOptions, parseSourceFile } from '../parse/parse-claims.js';
import { listSourceFiles } from '../scan/list-source-files.js';
import { resolvePatramGraphConfig } from '../config/resolve-patram-graph-config.js';

/**
 * Project graph loading pipeline.
 *
 * Loads config, scans source files, parses claims, and materializes the graph
 * used by CLI commands.
 *
 * kind: graph
 * status: active
 * uses_term: ../../docs/reference/terms/claim.md
 * uses_term: ../../docs/reference/terms/graph.md
 * uses_term: ../../docs/reference/terms/mapping.md
 * tracked_in: ../../docs/plans/v0/source-anchor-dogfooding.md
 * decided_by: ../../docs/decisions/dogfood-query-graph-v0.md
 * @patram
 * @see {@link ../parse/parse-claims.js}
 * @see {@link ./build-graph.js}
 */

/**
 * Load config, source files, claims, and the materialized graph for one
 * project directory.
 *
 * @param {string} project_directory
 * @returns {Promise<{ claims: PatramClaim[], config: PatramRepoConfig, diagnostics: PatramDiagnostic[], graph: BuildGraphResult, source_file_paths: string[] }>}
 */
export async function loadProjectGraph(project_directory) {
  const load_result = await loadPatramConfig(project_directory);

  if (load_result.diagnostics.length > 0) {
    return {
      claims: [],
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
  const collect_result = await collectClaims(
    repo_config,
    source_file_paths,
    project_directory,
  );
  const graph_config = resolvePatramGraphConfig(repo_config);

  if (collect_result.diagnostics.length > 0) {
    return {
      claims: collect_result.claims,
      config: repo_config,
      diagnostics: collect_result.diagnostics,
      graph: {
        edges: [],
        nodes: {},
      },
      source_file_paths,
    };
  }

  return {
    claims: collect_result.claims,
    config: repo_config,
    diagnostics: [],
    graph: buildGraph(graph_config, collect_result.claims),
    source_file_paths,
  };
}

/**
 * @param {PatramRepoConfig} repo_config
 * @param {string[]} source_file_paths
 * @param {string} project_directory
 * @returns {Promise<{ claims: PatramClaim[], diagnostics: PatramDiagnostic[] }>}
 */
async function collectClaims(
  repo_config,
  source_file_paths,
  project_directory,
) {
  /** @type {PatramClaim[]} */
  const claims = [];
  /** @type {PatramDiagnostic[]} */
  const diagnostics = [];
  const parse_options = createParseOptions(repo_config);

  for (const source_file_path of source_file_paths) {
    const source_text = await readFile(
      resolve(project_directory, source_file_path),
      'utf8',
    );
    const parse_result = parseSourceFile(
      {
        path: source_file_path,
        source: source_text,
      },
      parse_options,
    );

    claims.push(...parse_result.claims);
    diagnostics.push(...parse_result.diagnostics);
  }

  return {
    claims,
    diagnostics,
  };
}
