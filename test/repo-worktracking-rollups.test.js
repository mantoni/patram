import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { expect, it } from 'vitest';

import { loadProjectGraph } from '../lib/load-project-graph.js';
import { queryGraph } from '../lib/query-graph.js';

/**
 * Repo worktracking rollup contract.
 *
 * Verifies the traversal and aggregate query language works against the repo's
 * documented decision, plan, and roadmap relations.
 *
 * Kind: support
 * Status: active
 * Tracked in: ../docs/plans/v0/query-traversal-and-aggregation.md
 * Decided by: ../docs/decisions/query-traversal-and-aggregation.md
 * @patram
 * @see {@link ../lib/query-graph.js}
 * @see {@link ../docs/decisions/query-traversal-and-aggregation.md}
 */

const repo_directory = dirname(
  fileURLToPath(new URL('../package.json', import.meta.url)),
);

it('evaluates decision rollups through incoming task traversal', async () => {
  const project_graph_result = await loadProjectGraph(repo_directory);

  expect(project_graph_result.diagnostics).toEqual([]);
  expect(
    selectPaths(
      project_graph_result.graph,
      'path=docs/decisions/query-traversal-and-aggregation.md and none(in:decided_by, kind=task and status not in [done, dropped, superseded])',
    ),
  ).toEqual(['docs/decisions/query-traversal-and-aggregation.md']);
});

it('evaluates plan rollups through incoming task traversal', async () => {
  const project_graph_result = await loadProjectGraph(repo_directory);

  expect(project_graph_result.diagnostics).toEqual([]);
  expect(
    selectPaths(
      project_graph_result.graph,
      'path=docs/plans/v0/query-traversal-and-aggregation.md and none(in:tracked_in, kind=task and status not in [done, dropped, superseded])',
    ),
  ).toEqual(['docs/plans/v0/query-traversal-and-aggregation.md']);
});

it('evaluates roadmap rollups through nested traversal aggregates', async () => {
  const project_graph_result = await loadProjectGraph(repo_directory);

  expect(project_graph_result.diagnostics).toEqual([]);
  expect(
    selectPaths(
      project_graph_result.graph,
      'path=docs/roadmap/query-language-extensions.md and none(in:tracked_in, kind=plan and any(in:tracked_in, kind=task and status not in [done, dropped, superseded]))',
    ),
  ).toEqual(['docs/roadmap/query-language-extensions.md']);
});

it('evaluates count rollups through incoming decision traversal', async () => {
  const project_graph_result = await loadProjectGraph(repo_directory);

  expect(project_graph_result.diagnostics).toEqual([]);
  expect(
    selectPaths(
      project_graph_result.graph,
      'path=docs/decisions/query-traversal-and-aggregation.md and count(in:decided_by, kind=task) = 0',
    ),
  ).toEqual(['docs/decisions/query-traversal-and-aggregation.md']);
});

it('does not materialize duplicated docs-prefixed worktracking targets', async () => {
  const project_graph_result = await loadProjectGraph(repo_directory);

  expect(project_graph_result.diagnostics).toEqual([]);
  expect(
    selectPaths(project_graph_result.graph, 'path^=docs/decisions/docs/'),
  ).toEqual([]);
  expect(
    selectPaths(project_graph_result.graph, 'path^=docs/plans/v0/docs/'),
  ).toEqual([]);
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
