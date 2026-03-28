import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { expect, it } from 'vitest';

import { loadProjectGraph } from '../lib/load-project-graph.js';
import { queryGraph } from '../lib/query-graph.js';
import repo_config from '../.patram.json' with { type: 'json' };

/**
 * Repo taxonomy contract.
 *
 * Verifies the canonical command and term taxonomy nodes stay queryable for
 * coding agents.
 *
 * Kind: support
 * Status: active
 * Tracked in: ../docs/plans/v0/repo-taxonomy-command-term-nodes.md
 * Decided by: ../docs/decisions/repo-taxonomy-command-term-nodes.md
 * @patram
 * @see {@link ../lib/load-project-graph.js}
 * @see {@link ../docs/decisions/repo-taxonomy-command-term-nodes.md}
 */

const repo_directory = dirname(
  fileURLToPath(new URL('../package.json', import.meta.url)),
);

it('indexes the canonical command taxonomy nodes', async () => {
  const project_graph_result = await loadProjectGraph(repo_directory);

  expect(project_graph_result.diagnostics).toEqual([]);
  expect(
    selectIds(
      project_graph_result.graph,
      project_graph_result.config,
      repo_config.queries['command-taxonomy'].where,
    ),
  ).toEqual([
    'command:check',
    'command:fields',
    'command:queries',
    'command:query',
    'command:refs',
    'command:show',
  ]);
});

it('indexes the canonical term taxonomy nodes', async () => {
  const project_graph_result = await loadProjectGraph(repo_directory);

  expect(project_graph_result.diagnostics).toEqual([]);
  expect(
    selectIds(
      project_graph_result.graph,
      project_graph_result.config,
      repo_config.queries['term-taxonomy'].where,
    ),
  ).toEqual([
    'term:claim',
    'term:document',
    'term:graph',
    'term:kind',
    'term:mapping',
    'term:query',
    'term:relation',
  ]);
});

it('indexes stored command implementation entrypoints', async () => {
  const project_graph_result = await loadProjectGraph(repo_directory);

  expect(project_graph_result.diagnostics).toEqual([]);
  expect(
    selectPaths(
      project_graph_result.graph,
      project_graph_result.config,
      repo_config.queries['command-implementations'].where,
    ),
  ).toEqual(['lib/cli/main.js']);
});

it('filters source anchors by exact semantic command target', async () => {
  const project_graph_result = await loadProjectGraph(repo_directory);

  expect(project_graph_result.diagnostics).toEqual([]);
  expect(
    selectPaths(
      project_graph_result.graph,
      project_graph_result.config,
      'implements_command=command:query',
    ),
  ).toEqual(['lib/cli/main.js']);
});

it('indexes stored term usage entrypoints', async () => {
  const project_graph_result = await loadProjectGraph(repo_directory);

  expect(project_graph_result.diagnostics).toEqual([]);
  expect(
    selectPaths(
      project_graph_result.graph,
      project_graph_result.config,
      repo_config.queries['term-usage'].where,
    ),
  ).toEqual([
    'docs/graph-v0.md',
    'lib/graph/build-graph.js',
    'lib/graph/load-project-graph.js',
    'lib/graph/overlay-graph.js',
    'lib/graph/query-graph.js',
    'lib/parse/parse-claims.js',
  ]);
});

it('filters source anchors by exact semantic term target', async () => {
  const project_graph_result = await loadProjectGraph(repo_directory);

  expect(project_graph_result.diagnostics).toEqual([]);
  expect(
    selectPaths(
      project_graph_result.graph,
      project_graph_result.config,
      'uses_term=term:graph',
    ),
  ).toEqual([
    'docs/graph-v0.md',
    'lib/graph/build-graph.js',
    'lib/graph/load-project-graph.js',
    'lib/graph/overlay-graph.js',
    'lib/graph/query-graph.js',
  ]);
});

/**
 * @param {import('../lib/build-graph.types.ts').BuildGraphResult} graph
 * @param {import('../lib/load-patram-config.types.ts').PatramRepoConfig} repo_config
 * @param {string} where_clause
 * @returns {string[]}
 */
function selectPaths(graph, repo_config, where_clause) {
  return queryGraph(graph, where_clause, repo_config).nodes.flatMap(
    (graph_node) => (graph_node.path ? [graph_node.path] : []),
  );
}

/**
 * @param {import('../lib/build-graph.types.ts').BuildGraphResult} graph
 * @param {import('../lib/load-patram-config.types.ts').PatramRepoConfig} repo_config
 * @param {string} where_clause
 * @returns {string[]}
 */
function selectIds(graph, repo_config, where_clause) {
  return queryGraph(graph, where_clause, repo_config).nodes.map(
    (graph_node) => graph_node.id,
  );
}
