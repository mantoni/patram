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
    'doc:docs/decisions/show-output-v0.md',
    'doc:docs/tasks/v0/query-command.md',
  ]);
  expect(query_result.total_count).toBe(4);
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
  };
}
