import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { expect, it } from 'vitest';

import { loadProjectGraph } from '../lib/load-project-graph.js';
import { queryGraph } from '../lib/query-graph.js';
import repo_config from '../.patram.json' with { type: 'json' };

/**
 * Source anchor coverage contract.
 *
 * Loads the repo graph and verifies the source-anchor sweep stays queryable
 * across the documented source kinds.
 *
 * Kind: support
 * Status: active
 * Tracked in: ../docs/plans/v0/source-anchor-dogfooding.md
 * Decided by: ../docs/decisions/source-anchor-dogfooding.md
 * @patram
 * @see {@link ../lib/load-project-graph.js}
 * @see {@link ../docs/plans/v0/source-anchor-dogfooding.md}
 */

const repo_directory = dirname(
  fileURLToPath(new URL('../package.json', import.meta.url)),
);

it('indexes source anchors across the repo sweep', async () => {
  const project_graph_result = await loadProjectGraph(repo_directory);

  expect(project_graph_result.diagnostics).toEqual([]);
  expect(
    selectPaths(
      project_graph_result.graph,
      project_graph_result.config,
      '$path^=bin/',
    ),
  ).not.toEqual([]);
  expect(
    selectPaths(
      project_graph_result.graph,
      project_graph_result.config,
      '$path^=lib/',
    ),
  ).not.toEqual([]);
  expect(
    selectPaths(
      project_graph_result.graph,
      project_graph_result.config,
      '$path^=scripts/',
    ),
  ).not.toEqual([]);
  expect(
    selectPaths(
      project_graph_result.graph,
      project_graph_result.config,
      '$path^=test/',
    ),
  ).not.toEqual([]);
});

it('keeps the documented source stored queries useful', async () => {
  const project_graph_result = await loadProjectGraph(repo_directory);

  expect(
    selectPaths(
      project_graph_result.graph,
      project_graph_result.config,
      repo_config.queries['source-parse'].where,
    ),
  ).toEqual([
    'lib/parse-claims.js',
    'lib/parse-jsdoc-claims.js',
    'lib/parse-markdown-claims.js',
    'lib/parse-yaml-claims.js',
    'lib/tagged-fenced-blocks.js',
  ]);
  expect(
    selectPaths(
      project_graph_result.graph,
      project_graph_result.config,
      repo_config.queries['source-graph'].where,
    ),
  ).toEqual([
    'lib/build-graph.js',
    'lib/check-directive-metadata.js',
    'lib/check-graph.js',
    'lib/load-project-graph.js',
    'lib/query-graph.js',
  ]);
  expect(
    selectPaths(
      project_graph_result.graph,
      project_graph_result.config,
      repo_config.queries['source-output'].where,
    ),
  ).toEqual([
    'lib/command-output.js',
    'lib/derived-summary.js',
    'lib/render-output-view.js',
    'lib/show-document.js',
  ]);
});

/**
 * @param {import('../lib/build-graph.types.ts').BuildGraphResult} graph
 * @param {import('../lib/load-patram-config.types.ts').PatramRepoConfig} repo_config
 * @param {string} where_clause
 */
function selectPaths(graph, repo_config, where_clause) {
  return queryGraph(graph, where_clause, repo_config).nodes.map(
    (graph_node) => graph_node.path,
  );
}
