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
    selectPaths(
      project_graph_result.graph,
      repo_config.queries['command-taxonomy'].where,
    ),
  ).toEqual([
    'docs/reference/commands/check.md',
    'docs/reference/commands/queries.md',
    'docs/reference/commands/query.md',
    'docs/reference/commands/show.md',
  ]);
});

it('indexes the canonical term taxonomy nodes', async () => {
  const project_graph_result = await loadProjectGraph(repo_directory);

  expect(project_graph_result.diagnostics).toEqual([]);
  expect(
    selectPaths(
      project_graph_result.graph,
      repo_config.queries['term-taxonomy'].where,
    ),
  ).toEqual([
    'docs/reference/terms/claim.md',
    'docs/reference/terms/document.md',
    'docs/reference/terms/graph.md',
    'docs/reference/terms/kind.md',
    'docs/reference/terms/mapping.md',
    'docs/reference/terms/query.md',
    'docs/reference/terms/relation.md',
  ]);
});

/**
 * @param {import('../lib/build-graph.types.ts').BuildGraphResult} graph
 * @param {string} where_clause
 * @returns {string[]}
 */
function selectPaths(graph, where_clause) {
  return queryGraph(graph, where_clause).nodes.flatMap((graph_node) =>
    graph_node.path ? [graph_node.path] : [],
  );
}
