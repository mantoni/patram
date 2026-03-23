/* eslint-disable max-lines, max-lines-per-function */
/**
 * @import { BuildGraphResult } from './build-graph.types.ts';
 */

import { expect, it } from 'vitest';

import { queryGraph } from './query-graph.js';

it('filters graph nodes by equality clauses', () => {
  const query_result = queryGraph(
    createQueryGraph(),
    'kind=task and status=pending',
  );

  expect(query_result.diagnostics).toEqual([]);
  expect(query_result.nodes.map((graph_node) => graph_node.id)).toEqual([
    'doc:docs/tasks/v0/query-command.md',
  ]);
  expect(query_result.total_count).toBe(1);
});

it('filters graph nodes by path prefix and title text', () => {
  const query_result = queryGraph(
    createQueryGraph(),
    'path^=docs/decisions/ and title~Query',
  );

  expect(query_result.diagnostics).toEqual([]);
  expect(query_result.nodes.map((graph_node) => graph_node.id)).toEqual([
    'doc:docs/decisions/query-language-v0.md',
  ]);
});

it('filters graph nodes by relation existence', () => {
  const query_result = queryGraph(createQueryGraph(), 'blocked_by:*');

  expect(query_result.diagnostics).toEqual([]);
  expect(query_result.nodes.map((graph_node) => graph_node.id)).toEqual([
    'doc:docs/tasks/v0/show-command.md',
  ]);
});

it('filters graph nodes by exact relation target', () => {
  const query_result = queryGraph(
    createQueryGraph(),
    'implements_command=command:query',
  );

  expect(query_result.diagnostics).toEqual([]);
  expect(query_result.nodes.map((graph_node) => graph_node.id)).toEqual([
    'doc:lib/patram-cli.js',
  ]);
});

it('filters graph nodes by missing exact relation target', () => {
  const query_result = queryGraph(
    createQueryGraph(),
    'path^=docs/ and not implements_command=command:query',
  );

  expect(query_result.diagnostics).toEqual([]);
  expect(query_result.nodes.map((graph_node) => graph_node.id)).toEqual([
    'command:query',
    'doc:docs/decisions/query-language-v0.md',
    'doc:docs/decisions/show-output-v0.md',
    'doc:docs/tasks/v0/query-command.md',
    'doc:docs/tasks/v0/show-command.md',
  ]);
});

it('filters graph nodes by exact path', () => {
  const query_result = queryGraph(
    createQueryGraph(),
    'path=docs/tasks/v0/show-command.md',
  );

  expect(query_result.diagnostics).toEqual([]);
  expect(query_result.nodes.map((graph_node) => graph_node.id)).toEqual([
    'doc:docs/tasks/v0/show-command.md',
  ]);
});

it('filters graph nodes by semantic id', () => {
  const query_result = queryGraph(createQueryGraph(), 'id=command:query');

  expect(query_result.diagnostics).toEqual([]);
  expect(query_result.nodes.map((graph_node) => graph_node.id)).toEqual([
    'command:query',
  ]);
});

it('filters graph nodes by semantic id prefix', () => {
  const query_result = queryGraph(createQueryGraph(), 'id^=command:');

  expect(query_result.diagnostics).toEqual([]);
  expect(query_result.nodes.map((graph_node) => graph_node.id)).toEqual([
    'command:query',
  ]);
});

it('filters graph nodes by missing relation existence', () => {
  const query_result = queryGraph(
    createQueryGraph(),
    'kind=task and not blocked_by:*',
  );

  expect(query_result.diagnostics).toEqual([]);
  expect(query_result.nodes.map((graph_node) => graph_node.id)).toEqual([
    'doc:docs/tasks/v0/query-command.md',
  ]);
});

it('filters graph nodes by incoming traversal with membership terms', () => {
  const query_result = queryGraph(
    createAggregateQueryGraph(),
    'kind=decision and none(in:decided_by, kind=task and status not in [done, dropped, superseded])',
  );

  expect(query_result.diagnostics).toEqual([]);
  expect(query_result.nodes.map((graph_node) => graph_node.id)).toEqual([
    'doc:docs/decisions/finished-rollup.md',
    'doc:docs/decisions/orphan-rollup.md',
  ]);
});

it('filters graph nodes by outgoing traversal aggregates', () => {
  const query_result = queryGraph(
    createAggregateQueryGraph(),
    'kind=task and any(out:tracked_in, kind=plan and status=active)',
  );

  expect(query_result.diagnostics).toEqual([]);
  expect(query_result.nodes.map((graph_node) => graph_node.id)).toEqual([
    'doc:docs/tasks/v0/blocking-task.md',
    'doc:docs/tasks/v0/open-task.md',
  ]);
});

it('filters graph nodes by nested traversal aggregates', () => {
  const query_result = queryGraph(
    createAggregateQueryGraph(),
    'kind=roadmap and none(in:tracked_in, kind=plan and any(in:tracked_in, kind=task and status not in [done, dropped, superseded]))',
  );

  expect(query_result.diagnostics).toEqual([]);
  expect(query_result.nodes.map((graph_node) => graph_node.id)).toEqual([
    'doc:docs/roadmap/complete-roadmap.md',
  ]);
});

it('filters graph nodes by count aggregates', () => {
  const query_result = queryGraph(
    createAggregateQueryGraph(),
    'kind=decision and count(in:decided_by, kind=task) = 0',
  );

  expect(query_result.diagnostics).toEqual([]);
  expect(query_result.nodes.map((graph_node) => graph_node.id)).toEqual([
    'doc:docs/decisions/orphan-rollup.md',
  ]);
});

it('reports invalid query syntax', () => {
  const query_result = queryGraph(
    createQueryGraph(),
    'kind=task or status=done',
  );

  expect(query_result.nodes).toEqual([]);
  expect(query_result.diagnostics).toEqual([
    {
      code: 'query.invalid',
      column: 11,
      level: 'error',
      line: 1,
      message: 'Unsupported query token "or".',
      path: '<query>',
    },
  ]);
});

it('reports an unexpected operator at the start of a query', () => {
  const query_result = queryGraph(createQueryGraph(), 'and kind=task');

  expect(query_result.nodes).toEqual([]);
  expect(query_result.diagnostics).toEqual([
    {
      code: 'query.invalid',
      column: 1,
      level: 'error',
      line: 1,
      message: 'Unsupported query token "and".',
      path: '<query>',
    },
  ]);
});

it('reports an unsupported query term', () => {
  const query_result = queryGraph(createQueryGraph(), 'owner=max');

  expect(query_result.nodes).toEqual([]);
  expect(query_result.diagnostics).toEqual([
    {
      code: 'query.invalid',
      column: 1,
      level: 'error',
      line: 1,
      message: 'Unsupported query token "owner=max".',
      path: '<query>',
    },
  ]);
});

it('reports an empty query', () => {
  const query_result = queryGraph(createQueryGraph(), '');

  expect(query_result.nodes).toEqual([]);
  expect(query_result.diagnostics).toEqual([
    {
      code: 'query.invalid',
      column: 1,
      level: 'error',
      line: 1,
      message: 'Query must not be empty.',
      path: '<query>',
    },
  ]);
});

it('reports a trailing operator', () => {
  const query_result = queryGraph(createQueryGraph(), 'kind=task and');

  expect(query_result.nodes).toEqual([]);
  expect(query_result.diagnostics).toEqual([
    {
      code: 'query.invalid',
      column: 14,
      level: 'error',
      line: 1,
      message: 'Expected a query term.',
      path: '<query>',
    },
  ]);
});

it('applies offset and limit after sorting matches', () => {
  const query_result = queryGraph(createQueryGraph(), 'path^=docs/', {
    limit: 2,
    offset: 1,
  });

  expect(query_result.diagnostics).toEqual([]);
  expect(query_result.nodes.map((graph_node) => graph_node.id)).toEqual([
    'doc:docs/decisions/query-language-v0.md',
    'doc:docs/decisions/show-output-v0.md',
  ]);
  expect(query_result.total_count).toBe(5);
});

/**
 * @returns {BuildGraphResult}
 */
function createQueryGraph() {
  return {
    edges: createQueryEdges(),
    nodes: createQueryNodes(),
  };
}

/**
 * @returns {BuildGraphResult['edges']}
 */
function createQueryEdges() {
  return [
    {
      from: 'doc:docs/tasks/v0/show-command.md',
      id: 'edge:1',
      origin: {
        column: 1,
        line: 5,
        path: 'docs/tasks/v0/show-command.md',
      },
      relation: 'blocked_by',
      to: 'doc:docs/decisions/show-output-v0.md',
    },
    {
      from: 'doc:lib/patram-cli.js',
      id: 'edge:2',
      origin: {
        column: 1,
        line: 1,
        path: 'lib/patram-cli.js',
      },
      relation: 'implements_command',
      to: 'command:query',
    },
  ];
}

/**
 * @returns {BuildGraphResult['nodes']}
 */
function createQueryNodes() {
  return {
    'doc:docs/decisions/query-language-v0.md': {
      id: 'doc:docs/decisions/query-language-v0.md',
      kind: 'decision',
      path: 'docs/decisions/query-language-v0.md',
      status: 'accepted',
      title: 'Query Language v0 Proposal',
    },
    'doc:docs/decisions/show-output-v0.md': {
      id: 'doc:docs/decisions/show-output-v0.md',
      kind: 'decision',
      path: 'docs/decisions/show-output-v0.md',
      status: 'accepted',
      title: 'Show Output v0 Proposal',
    },
    'doc:docs/tasks/v0/query-command.md': {
      id: 'doc:docs/tasks/v0/query-command.md',
      kind: 'task',
      path: 'docs/tasks/v0/query-command.md',
      status: 'pending',
      title: 'Implement Query Command',
    },
    'doc:docs/tasks/v0/show-command.md': {
      id: 'doc:docs/tasks/v0/show-command.md',
      kind: 'task',
      path: 'docs/tasks/v0/show-command.md',
      status: 'blocked',
      title: 'Implement Show Command',
    },
    'command:query': {
      id: 'command:query',
      kind: 'command',
      path: 'docs/reference/commands/query.md',
      title: 'query',
    },
    'doc:lib/patram-cli.js': {
      id: 'doc:lib/patram-cli.js',
      kind: 'document',
      path: 'lib/patram-cli.js',
      title: 'Patram command execution flow.',
    },
  };
}

/**
 * @returns {BuildGraphResult}
 */
function createAggregateQueryGraph() {
  return {
    edges: createAggregateQueryEdges(),
    nodes: createAggregateQueryNodes(),
  };
}

/**
 * @returns {BuildGraphResult['edges']}
 */
function createAggregateQueryEdges() {
  return [
    createEdge(
      'doc:docs/tasks/v0/open-task.md',
      'edge:aggregate:1',
      'decided_by',
      'doc:docs/decisions/active-rollup.md',
    ),
    createEdge(
      'doc:docs/tasks/v0/open-task.md',
      'edge:aggregate:2',
      'tracked_in',
      'doc:docs/plans/v0/active-plan.md',
    ),
    createEdge(
      'doc:docs/tasks/v0/blocking-task.md',
      'edge:aggregate:3',
      'decided_by',
      'doc:docs/decisions/active-rollup.md',
    ),
    createEdge(
      'doc:docs/tasks/v0/blocking-task.md',
      'edge:aggregate:4',
      'tracked_in',
      'doc:docs/plans/v0/active-plan.md',
    ),
    createEdge(
      'doc:docs/tasks/v0/done-task.md',
      'edge:aggregate:5',
      'decided_by',
      'doc:docs/decisions/finished-rollup.md',
    ),
    createEdge(
      'doc:docs/tasks/v0/done-task.md',
      'edge:aggregate:6',
      'tracked_in',
      'doc:docs/plans/v0/complete-plan.md',
    ),
    createEdge(
      'doc:docs/tasks/v0/dropped-task.md',
      'edge:aggregate:7',
      'decided_by',
      'doc:docs/decisions/finished-rollup.md',
    ),
    createEdge(
      'doc:docs/tasks/v0/dropped-task.md',
      'edge:aggregate:8',
      'tracked_in',
      'doc:docs/plans/v0/complete-plan.md',
    ),
    createEdge(
      'doc:docs/plans/v0/active-plan.md',
      'edge:aggregate:9',
      'tracked_in',
      'doc:docs/roadmap/active-roadmap.md',
    ),
    createEdge(
      'doc:docs/plans/v0/complete-plan.md',
      'edge:aggregate:10',
      'tracked_in',
      'doc:docs/roadmap/complete-roadmap.md',
    ),
  ];
}

/**
 * @returns {BuildGraphResult['nodes']}
 */
function createAggregateQueryNodes() {
  return {
    'doc:docs/decisions/active-rollup.md': createNode(
      'doc:docs/decisions/active-rollup.md',
      'decision',
      'docs/decisions/active-rollup.md',
      'accepted',
      'Active Rollup',
    ),
    'doc:docs/decisions/finished-rollup.md': createNode(
      'doc:docs/decisions/finished-rollup.md',
      'decision',
      'docs/decisions/finished-rollup.md',
      'accepted',
      'Finished Rollup',
    ),
    'doc:docs/decisions/orphan-rollup.md': createNode(
      'doc:docs/decisions/orphan-rollup.md',
      'decision',
      'docs/decisions/orphan-rollup.md',
      'accepted',
      'Orphan Rollup',
    ),
    'doc:docs/plans/v0/active-plan.md': createNode(
      'doc:docs/plans/v0/active-plan.md',
      'plan',
      'docs/plans/v0/active-plan.md',
      'active',
      'Active Plan',
    ),
    'doc:docs/plans/v0/complete-plan.md': createNode(
      'doc:docs/plans/v0/complete-plan.md',
      'plan',
      'docs/plans/v0/complete-plan.md',
      'superseded',
      'Complete Plan',
    ),
    'doc:docs/roadmap/active-roadmap.md': createNode(
      'doc:docs/roadmap/active-roadmap.md',
      'roadmap',
      'docs/roadmap/active-roadmap.md',
      'active',
      'Active Roadmap',
    ),
    'doc:docs/roadmap/complete-roadmap.md': createNode(
      'doc:docs/roadmap/complete-roadmap.md',
      'roadmap',
      'docs/roadmap/complete-roadmap.md',
      'active',
      'Complete Roadmap',
    ),
    'doc:docs/tasks/v0/blocking-task.md': createNode(
      'doc:docs/tasks/v0/blocking-task.md',
      'task',
      'docs/tasks/v0/blocking-task.md',
      'blocked',
      'Blocking Task',
    ),
    'doc:docs/tasks/v0/done-task.md': createNode(
      'doc:docs/tasks/v0/done-task.md',
      'task',
      'docs/tasks/v0/done-task.md',
      'done',
      'Done Task',
    ),
    'doc:docs/tasks/v0/dropped-task.md': createNode(
      'doc:docs/tasks/v0/dropped-task.md',
      'task',
      'docs/tasks/v0/dropped-task.md',
      'dropped',
      'Dropped Task',
    ),
    'doc:docs/tasks/v0/open-task.md': createNode(
      'doc:docs/tasks/v0/open-task.md',
      'task',
      'docs/tasks/v0/open-task.md',
      'pending',
      'Open Task',
    ),
  };
}

/**
 * @param {string} from_id
 * @param {string} edge_id
 * @param {string} relation_name
 * @param {string} to_id
 * @returns {BuildGraphResult['edges'][number]}
 */
function createEdge(from_id, edge_id, relation_name, to_id) {
  return {
    from: from_id,
    id: edge_id,
    origin: {
      column: 1,
      line: 1,
      path: 'fixture.md',
    },
    relation: relation_name,
    to: to_id,
  };
}

/**
 * @param {string} node_id
 * @param {string} node_kind
 * @param {string} node_path
 * @param {string | undefined} node_status
 * @param {string} node_title
 * @returns {BuildGraphResult['nodes'][string]}
 */
function createNode(node_id, node_kind, node_path, node_status, node_title) {
  return {
    id: node_id,
    kind: node_kind,
    path: node_path,
    status: node_status,
    title: node_title,
  };
}
