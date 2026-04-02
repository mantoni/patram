import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { expect, it } from 'vitest';

import { loadProjectGraph } from '../lib/graph/load-project-graph.js';
import { queryGraph } from '../lib/graph/query/execute.js';
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
 * @see {@link ../lib/graph/load-project-graph.js}
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
      "MATCH (n) WHERE path(n) STARTS WITH 'bin/' RETURN n",
    ),
  ).not.toEqual([]);
  expect(
    selectPaths(
      project_graph_result.graph,
      project_graph_result.config,
      "MATCH (n) WHERE path(n) STARTS WITH 'lib/' RETURN n",
    ),
  ).not.toEqual([]);
  expect(
    selectPaths(
      project_graph_result.graph,
      project_graph_result.config,
      "MATCH (n) WHERE path(n) STARTS WITH 'scripts/' RETURN n",
    ),
  ).not.toEqual([]);
  expect(
    selectPaths(
      project_graph_result.graph,
      project_graph_result.config,
      "MATCH (n) WHERE path(n) STARTS WITH 'test/' RETURN n",
    ),
  ).not.toEqual([]);
});

it('keeps the documented source stored queries useful', async () => {
  const project_graph_result = await loadProjectGraph(repo_directory);

  expect(
    selectPaths(
      project_graph_result.graph,
      project_graph_result.config,
      getStoredQueryText(repo_config.queries['source-parse']),
    ),
  ).toEqual([
    'lib/parse/jsdoc/parse-jsdoc-claims.js',
    'lib/parse/markdown/parse-markdown-claims.js',
    'lib/parse/parse-claims.js',
    'lib/parse/tagged-fenced/tagged-fenced-blocks.js',
    'lib/parse/yaml/parse-yaml-claims.js',
  ]);
  expect(
    selectPaths(
      project_graph_result.graph,
      project_graph_result.config,
      getStoredQueryText(repo_config.queries['source-graph']),
    ),
  ).toEqual([
    'lib/graph/build-graph.js',
    'lib/graph/check-directive-metadata.js',
    'lib/graph/check-graph.js',
    'lib/graph/load-project-graph.js',
    'lib/graph/query/execute.js',
  ]);
  expect(
    selectPaths(
      project_graph_result.graph,
      project_graph_result.config,
      getStoredQueryText(repo_config.queries['source-output']),
    ),
  ).toEqual([
    'lib/output/command-output.js',
    'lib/output/render-output-view.js',
    'lib/output/show-document.js',
  ]);
});

/**
 * @param {import('../lib/graph/build-graph.types.ts').BuildGraphResult} graph
 * @param {import('../lib/config/load-patram-config.types.ts').PatramRepoConfig} repo_config
 * @param {string} where_clause
 */
function selectPaths(graph, repo_config, where_clause) {
  return queryGraph(graph, where_clause, repo_config).nodes.flatMap(
    (graph_node) =>
      graph_node.identity.path ? [graph_node.identity.path] : [],
  );
}

/**
 * @param {{ cypher?: string, where?: string }} stored_query
 * @returns {string}
 */
function getStoredQueryText(stored_query) {
  const query_text = stored_query.cypher ?? stored_query.where;

  if (!query_text) {
    throw new Error('Expected a stored query text.');
  }

  return query_text;
}
