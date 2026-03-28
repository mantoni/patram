/* eslint-disable max-lines, max-lines-per-function */
/**
 * @import { BuildGraphResult } from '../build-graph.types.ts';
 * @import { PatramRepoConfig } from '../../config/load-patram-config.types.ts';
 */

import { expect, it } from 'vitest';

import { queryGraph } from './execute.js';

/** @type {PatramRepoConfig} */
const QUERY_REPO_CONFIG = {
  fields: {
    status: {
      type: 'enum',
      values: [
        'accepted',
        'active',
        'blocked',
        'done',
        'dropped',
        'pending',
        'superseded',
      ],
    },
  },
  include: [],
  queries: {},
  relations: {
    blocked_by: {
      from: ['task'],
      to: ['decision'],
    },
    decided_by: {
      from: ['task'],
      to: ['decision'],
    },
    implements_command: {
      from: ['document'],
      to: ['command'],
    },
    tracked_in: {
      from: ['task', 'plan'],
      to: ['plan', 'roadmap'],
    },
  },
};

it('filters graph nodes by equality clauses', () => {
  const query_result = queryGraph(
    createQueryGraph(),
    '$class=task and status=pending',
    QUERY_REPO_CONFIG,
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
    '$path^=docs/decisions/ and title~Query',
    QUERY_REPO_CONFIG,
  );

  expect(query_result.diagnostics).toEqual([]);
  expect(query_result.nodes.map((graph_node) => graph_node.id)).toEqual([
    'doc:docs/decisions/query-language-v0.md',
  ]);
});

it('filters graph nodes by relation existence', () => {
  const query_result = queryGraph(
    createQueryGraph(),
    'blocked_by:*',
    QUERY_REPO_CONFIG,
  );

  expect(query_result.diagnostics).toEqual([]);
  expect(query_result.nodes.map((graph_node) => graph_node.id)).toEqual([
    'doc:docs/tasks/v0/show-command.md',
  ]);
});

it('filters graph nodes by exact relation target', () => {
  const query_result = queryGraph(
    createQueryGraph(),
    'implements_command=command:query',
    QUERY_REPO_CONFIG,
  );

  expect(query_result.diagnostics).toEqual([]);
  expect(query_result.nodes.map((graph_node) => graph_node.id)).toEqual([
    'doc:lib/cli/main.js',
  ]);
});

it('filters graph nodes by exact relation target bindings', () => {
  const query_result = queryGraph(
    createQueryGraph(),
    'implements_command=@command',
    QUERY_REPO_CONFIG,
    {
      bindings: {
        command: 'command:query',
      },
    },
  );

  expect(query_result.diagnostics).toEqual([]);
  expect(query_result.nodes.map((graph_node) => graph_node.id)).toEqual([
    'doc:lib/cli/main.js',
  ]);
});

it('filters graph nodes by missing exact relation target', () => {
  const query_result = queryGraph(
    createQueryGraph(),
    '$path^=docs/ and not implements_command=command:query',
    QUERY_REPO_CONFIG,
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
    '$path=docs/tasks/v0/show-command.md',
    QUERY_REPO_CONFIG,
  );

  expect(query_result.diagnostics).toEqual([]);
  expect(query_result.nodes.map((graph_node) => graph_node.id)).toEqual([
    'doc:docs/tasks/v0/show-command.md',
  ]);
});

it('filters graph nodes by semantic id', () => {
  const query_result = queryGraph(
    createQueryGraph(),
    '$id=command:query',
    QUERY_REPO_CONFIG,
  );

  expect(query_result.diagnostics).toEqual([]);
  expect(query_result.nodes.map((graph_node) => graph_node.id)).toEqual([
    'command:query',
  ]);
});

it('filters graph nodes by semantic id prefix', () => {
  const query_result = queryGraph(
    createQueryGraph(),
    '$id^=command:',
    QUERY_REPO_CONFIG,
  );

  expect(query_result.diagnostics).toEqual([]);
  expect(query_result.nodes.map((graph_node) => graph_node.id)).toEqual([
    'command:query',
  ]);
});

it('filters graph nodes by missing relation existence', () => {
  const query_result = queryGraph(
    createQueryGraph(),
    '$class=task and not blocked_by:*',
    QUERY_REPO_CONFIG,
  );

  expect(query_result.diagnostics).toEqual([]);
  expect(query_result.nodes.map((graph_node) => graph_node.id)).toEqual([
    'doc:docs/tasks/v0/query-command.md',
  ]);
});

it('filters graph nodes by incoming traversal with membership terms', () => {
  const query_result = queryGraph(
    createAggregateQueryGraph(),
    '$class=decision and none(in:decided_by, $class=task and status not in [done, dropped, superseded])',
    QUERY_REPO_CONFIG,
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
    '$class=task and any(out:tracked_in, $class=plan and status=active)',
    QUERY_REPO_CONFIG,
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
    '$class=roadmap and none(in:tracked_in, $class=plan and any(in:tracked_in, $class=task and status not in [done, dropped, superseded]))',
    QUERY_REPO_CONFIG,
  );

  expect(query_result.diagnostics).toEqual([]);
  expect(query_result.nodes.map((graph_node) => graph_node.id)).toEqual([
    'doc:docs/roadmap/complete-roadmap.md',
  ]);
});

it('filters graph nodes by count aggregates', () => {
  const query_result = queryGraph(
    createAggregateQueryGraph(),
    '$class=decision and count(in:decided_by, $class=task) = 0',
    QUERY_REPO_CONFIG,
  );

  expect(query_result.diagnostics).toEqual([]);
  expect(query_result.nodes.map((graph_node) => graph_node.id)).toEqual([
    'doc:docs/decisions/orphan-rollup.md',
  ]);
});

it('filters graph nodes by `or` with `and` precedence', () => {
  const query_result = queryGraph(
    createQueryGraph(),
    '$class=task or status=accepted and title~Show',
    QUERY_REPO_CONFIG,
  );

  expect(query_result.diagnostics).toEqual([]);
  expect(query_result.nodes.map((graph_node) => graph_node.id)).toEqual([
    'doc:docs/decisions/show-output-v0.md',
    'doc:docs/tasks/v0/query-command.md',
    'doc:docs/tasks/v0/show-command.md',
  ]);
});

it('reports an unexpected operator at the start of a query', () => {
  const query_result = queryGraph(
    createQueryGraph(),
    'and $class=task',
    QUERY_REPO_CONFIG,
  );

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

it('filters graph nodes by explicit grouping', () => {
  const query_result = queryGraph(
    createQueryGraph(),
    '($class=task or status=accepted) and title~Show',
    QUERY_REPO_CONFIG,
  );

  expect(query_result.diagnostics).toEqual([]);
  expect(query_result.nodes.map((graph_node) => graph_node.id)).toEqual([
    'doc:docs/decisions/show-output-v0.md',
    'doc:docs/tasks/v0/show-command.md',
  ]);
});

it('filters graph nodes by nested `or` expressions inside aggregates', () => {
  const query_result = queryGraph(
    createAggregateQueryGraph(),
    '$class=decision and none(in:decided_by, status=done or status=dropped)',
    QUERY_REPO_CONFIG,
  );

  expect(query_result.diagnostics).toEqual([]);
  expect(query_result.nodes.map((graph_node) => graph_node.id)).toEqual([
    'doc:docs/decisions/active-rollup.md',
    'doc:docs/decisions/orphan-rollup.md',
  ]);
});

it('reports an unsupported query term', () => {
  const query_result = queryGraph(
    createQueryGraph(),
    'owner=max',
    QUERY_REPO_CONFIG,
  );

  expect(query_result.nodes).toEqual([]);
  expect(query_result.diagnostics).toEqual([
    {
      code: 'query.unknown_field',
      column: 1,
      level: 'error',
      line: 1,
      message: 'Unknown field "owner".',
      path: '<query>',
    },
  ]);
});

it('reports an empty query', () => {
  const query_result = queryGraph(createQueryGraph(), '', QUERY_REPO_CONFIG);

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

it('reports a trailing boolean operator', () => {
  const query_result = queryGraph(
    createQueryGraph(),
    '$class=task or',
    QUERY_REPO_CONFIG,
  );

  expect(query_result.nodes).toEqual([]);
  expect(query_result.diagnostics).toEqual([
    {
      code: 'query.invalid',
      column: 15,
      level: 'error',
      line: 1,
      message: 'Expected a query term.',
      path: '<query>',
    },
  ]);
});

it('reports a trailing operator', () => {
  const query_result = queryGraph(
    createQueryGraph(),
    '$class=task and',
    QUERY_REPO_CONFIG,
  );

  expect(query_result.nodes).toEqual([]);
  expect(query_result.diagnostics).toEqual([
    {
      code: 'query.invalid',
      column: 16,
      level: 'error',
      line: 1,
      message: 'Expected a query term.',
      path: '<query>',
    },
  ]);
});

it('applies offset and limit after sorting matches', () => {
  const query_result = queryGraph(
    createQueryGraph(),
    '$path^=docs/',
    QUERY_REPO_CONFIG,
    {
      limit: 2,
      offset: 1,
    },
  );

  expect(query_result.diagnostics).toEqual([]);
  expect(query_result.nodes.map((graph_node) => graph_node.id)).toEqual([
    'doc:docs/decisions/query-language-v0.md',
    'doc:docs/decisions/show-output-v0.md',
  ]);
  expect(query_result.total_count).toBe(5);
});

it('applies bindings together with offset and limit after sorting matches', () => {
  const query_result = queryGraph(
    createQueryGraph(),
    '$path^=@docs_path',
    QUERY_REPO_CONFIG,
    {
      bindings: {
        docs_path: 'docs/',
      },
      limit: 2,
      offset: 1,
    },
  );

  expect(query_result.diagnostics).toEqual([]);
  expect(query_result.nodes.map((graph_node) => graph_node.id)).toEqual([
    'doc:docs/decisions/query-language-v0.md',
    'doc:docs/decisions/show-output-v0.md',
  ]);
  expect(query_result.total_count).toBe(5);
});

it('filters graph nodes by ordered field comparisons and array field values', () => {
  /** @type {PatramRepoConfig} */
  const comparison_repo_config = {
    ...QUERY_REPO_CONFIG,
    fields: {
      ...QUERY_REPO_CONFIG.fields,
      priority: {
        type: 'integer',
      },
      rank: {
        type: 'string',
      },
    },
  };
  const comparison_graph = createComparisonQueryGraph();

  expect(
    queryGraph(comparison_graph, 'priority < 2', comparison_repo_config).nodes,
  ).toEqual([comparison_graph.nodes.blank, comparison_graph.nodes.low]);
  expect(
    queryGraph(comparison_graph, 'priority <= 2', comparison_repo_config).nodes,
  ).toEqual([
    comparison_graph.nodes.blank,
    comparison_graph.nodes.low,
    comparison_graph.nodes.mid,
  ]);
  expect(
    queryGraph(comparison_graph, 'priority > 2', comparison_repo_config).nodes,
  ).toEqual([comparison_graph.nodes.high]);
  expect(
    queryGraph(comparison_graph, 'priority >= 2', comparison_repo_config).nodes,
  ).toEqual([comparison_graph.nodes.high, comparison_graph.nodes.mid]);
  expect(
    queryGraph(comparison_graph, 'priority != 2', comparison_repo_config).nodes,
  ).toEqual([
    comparison_graph.nodes.blank,
    comparison_graph.nodes.high,
    comparison_graph.nodes.low,
  ]);
});

it('filters graph nodes by count aggregate comparisons across all operators', () => {
  expect(
    queryGraph(
      createAggregateQueryGraph(),
      '$class=decision and count(in:decided_by, $class=task) != 0',
      QUERY_REPO_CONFIG,
    ).nodes.map((graph_node) => graph_node.id),
  ).toEqual([
    'doc:docs/decisions/active-rollup.md',
    'doc:docs/decisions/finished-rollup.md',
  ]);
  expect(
    queryGraph(
      createAggregateQueryGraph(),
      '$class=decision and count(in:decided_by, $class=task) < 1',
      QUERY_REPO_CONFIG,
    ).nodes.map((graph_node) => graph_node.id),
  ).toEqual(['doc:docs/decisions/orphan-rollup.md']);
  expect(
    queryGraph(
      createAggregateQueryGraph(),
      '$class=decision and count(in:decided_by, $class=task) <= 1',
      QUERY_REPO_CONFIG,
    ).nodes.map((graph_node) => graph_node.id),
  ).toEqual(['doc:docs/decisions/orphan-rollup.md']);
  expect(
    queryGraph(
      createAggregateQueryGraph(),
      '$class=decision and count(in:decided_by, $class=task) > 1',
      QUERY_REPO_CONFIG,
    ).nodes.map((graph_node) => graph_node.id),
  ).toEqual([
    'doc:docs/decisions/active-rollup.md',
    'doc:docs/decisions/finished-rollup.md',
  ]);
  expect(
    queryGraph(
      createAggregateQueryGraph(),
      '$class=decision and count(in:decided_by, $class=task) >= 2',
      QUERY_REPO_CONFIG,
    ).nodes.map((graph_node) => graph_node.id),
  ).toEqual([
    'doc:docs/decisions/active-rollup.md',
    'doc:docs/decisions/finished-rollup.md',
  ]);
});

it('reports a missing query binding', () => {
  const query_result = queryGraph(
    createQueryGraph(),
    'implements_command=@command',
    QUERY_REPO_CONFIG,
  );

  expect(query_result.nodes).toEqual([]);
  expect(query_result.diagnostics).toEqual([
    {
      code: 'query.binding_missing',
      column: 20,
      level: 'error',
      line: 1,
      message: 'Missing query binding "command".',
      path: '<query>',
    },
  ]);
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
 * @returns {BuildGraphResult}
 */
function createComparisonQueryGraph() {
  return /** @type {BuildGraphResult} */ (
    /** @type {unknown} */ ({
      edges: [],
      nodes: {
        blank: {
          $class: 'task',
          $id: 'blank',
          $path: 'docs/tasks/blank.md',
          id: 'blank',
          kind: 'task',
          path: 'docs/tasks/blank.md',
          priority: '',
          rank: 'alpha',
          title: 'Blank',
        },
        high: {
          $class: 'task',
          $id: 'high',
          $path: 'docs/tasks/high.md',
          id: 'high',
          kind: 'task',
          path: 'docs/tasks/high.md',
          priority: ['10', true],
          rank: 'gamma',
          title: 'High',
        },
        low: {
          $class: 'task',
          $id: 'low',
          $path: 'docs/tasks/low.md',
          id: 'low',
          kind: 'task',
          path: 'docs/tasks/low.md',
          priority: 1,
          rank: 'beta',
          title: 'Low',
        },
        mid: {
          $class: 'task',
          $id: 'mid',
          $path: 'docs/tasks/mid.md',
          id: 'mid',
          kind: 'task',
          path: 'docs/tasks/mid.md',
          priority: [2],
          rank: 'beta',
          title: 'Mid',
        },
      },
    })
  );
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
      from: 'doc:lib/cli/main.js',
      id: 'edge:2',
      origin: {
        column: 1,
        line: 1,
        path: 'lib/cli/main.js',
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
      $class: 'decision',
      $id: 'doc:docs/decisions/query-language-v0.md',
      $path: 'docs/decisions/query-language-v0.md',
      id: 'doc:docs/decisions/query-language-v0.md',
      kind: 'decision',
      path: 'docs/decisions/query-language-v0.md',
      status: 'accepted',
      title: 'Query Language v0 Proposal',
    },
    'doc:docs/decisions/show-output-v0.md': {
      $class: 'decision',
      $id: 'doc:docs/decisions/show-output-v0.md',
      $path: 'docs/decisions/show-output-v0.md',
      id: 'doc:docs/decisions/show-output-v0.md',
      kind: 'decision',
      path: 'docs/decisions/show-output-v0.md',
      status: 'accepted',
      title: 'Show Output v0 Proposal',
    },
    'doc:docs/tasks/v0/query-command.md': {
      $class: 'task',
      $id: 'doc:docs/tasks/v0/query-command.md',
      $path: 'docs/tasks/v0/query-command.md',
      id: 'doc:docs/tasks/v0/query-command.md',
      kind: 'task',
      path: 'docs/tasks/v0/query-command.md',
      status: 'pending',
      title: 'Implement Query Command',
    },
    'doc:docs/tasks/v0/show-command.md': {
      $class: 'task',
      $id: 'doc:docs/tasks/v0/show-command.md',
      $path: 'docs/tasks/v0/show-command.md',
      id: 'doc:docs/tasks/v0/show-command.md',
      kind: 'task',
      path: 'docs/tasks/v0/show-command.md',
      status: 'blocked',
      title: 'Implement Show Command',
    },
    'command:query': {
      $class: 'command',
      $id: 'command:query',
      $path: 'docs/reference/commands/query.md',
      id: 'command:query',
      kind: 'command',
      path: 'docs/reference/commands/query.md',
      title: 'query',
    },
    'doc:lib/cli/main.js': {
      $class: 'document',
      $id: 'doc:lib/cli/main.js',
      $path: 'lib/cli/main.js',
      id: 'doc:lib/cli/main.js',
      kind: 'document',
      path: 'lib/cli/main.js',
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
    $class: node_kind,
    $id: node_id,
    $path: node_path,
    id: node_id,
    kind: node_kind,
    path: node_path,
    status: node_status,
    title: node_title,
  };
}
