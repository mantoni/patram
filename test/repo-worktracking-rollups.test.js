import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { expect, it } from 'vitest';

import { loadProjectGraph } from '../lib/graph/load-project-graph.js';
import { queryGraph } from '../lib/graph/query/execute.js';

/**
 * Repo worktracking rollup contract.
 *
 * Verifies the traversal and aggregate query language works against the repo's
 * documented decision, plan, and roadmap relations.
 *
 * kind: support
 * status: active
 * tracked_in: ../docs/plans/v0/query-traversal-and-aggregation.md
 * decided_by: ../docs/decisions/query-traversal-and-aggregation.md
 * @patram
 * @see {@link ../lib/graph/query/execute.js}
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
      project_graph_result.config,
      "MATCH (n) WHERE path(n) = 'docs/decisions/query-traversal-and-aggregation.md' AND NOT EXISTS { MATCH (task:Task)-[:DECIDED_BY]->(n) WHERE task.status NOT IN ['done', 'dropped', 'superseded'] } RETURN n",
    ),
  ).toEqual(['docs/decisions/query-traversal-and-aggregation.md']);
});

it('evaluates plan rollups through incoming task traversal', async () => {
  const project_graph_result = await loadProjectGraph(repo_directory);

  expect(project_graph_result.diagnostics).toEqual([]);
  expect(
    selectPaths(
      project_graph_result.graph,
      project_graph_result.config,
      "MATCH (n) WHERE path(n) = 'docs/plans/v0/query-traversal-and-aggregation.md' AND NOT EXISTS { MATCH (task:Task)-[:TRACKED_IN]->(n) WHERE task.status NOT IN ['done', 'dropped', 'superseded'] } RETURN n",
    ),
  ).toEqual(['docs/plans/v0/query-traversal-and-aggregation.md']);
});

it('evaluates roadmap rollups through nested traversal aggregates', async () => {
  const project_graph_result = await loadProjectGraph(repo_directory);

  expect(project_graph_result.diagnostics).toEqual([]);
  expect(
    selectPaths(
      project_graph_result.graph,
      project_graph_result.config,
      "MATCH (n) WHERE path(n) = 'docs/roadmap/query-language-extensions.md' AND NOT EXISTS { MATCH (plan:Plan)-[:TRACKED_IN]->(n) WHERE EXISTS { MATCH (task:Task)-[:TRACKED_IN]->(plan) WHERE task.status NOT IN ['done', 'dropped', 'superseded'] } } RETURN n",
    ),
  ).toEqual(['docs/roadmap/query-language-extensions.md']);
});

it('evaluates count rollups through incoming decision traversal', async () => {
  const project_graph_result = await loadProjectGraph(repo_directory);

  expect(project_graph_result.diagnostics).toEqual([]);
  expect(
    selectPaths(
      project_graph_result.graph,
      project_graph_result.config,
      "MATCH (n) WHERE path(n) = 'docs/decisions/query-traversal-and-aggregation.md' AND COUNT { MATCH (task:Task)-[:DECIDED_BY]->(n) } = 1 RETURN n",
    ),
  ).toEqual(['docs/decisions/query-traversal-and-aggregation.md']);
});

it('does not materialize duplicated docs-prefixed worktracking targets', async () => {
  const project_graph_result = await loadProjectGraph(repo_directory);

  expect(project_graph_result.diagnostics).toEqual([]);
  expect(
    selectPaths(
      project_graph_result.graph,
      project_graph_result.config,
      "MATCH (n) WHERE path(n) STARTS WITH 'docs/decisions/docs/' RETURN n",
    ),
  ).toEqual([]);
  expect(
    selectPaths(
      project_graph_result.graph,
      project_graph_result.config,
      "MATCH (n) WHERE path(n) STARTS WITH 'docs/plans/v0/docs/' RETURN n",
    ),
  ).toEqual([]);
});

/**
 * @param {import('../lib/graph/build-graph.types.ts').BuildGraphResult} graph
 * @param {import('../lib/config/load-patram-config.types.ts').PatramRepoConfig} repo_config
 * @param {string} where_clause
 * @returns {string[]}
 */
function selectPaths(graph, repo_config, where_clause) {
  return queryGraph(graph, where_clause, repo_config).nodes.flatMap(
    (graph_node) =>
      graph_node.identity.path ? [graph_node.identity.path] : [],
  );
}
