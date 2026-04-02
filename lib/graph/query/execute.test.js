/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
/* eslint-disable max-lines, max-lines-per-function, @typescript-eslint/no-unsafe-return */
/**
 * @import { BuildGraphResult } from '../build-graph.types.ts';
 * @import { PatramRepoConfig } from '../../config/load-patram-config.types.ts';
 */

import { expect, it } from 'vitest';

import { queryGraph } from './execute.js';

/** @type {PatramRepoConfig} */
const QUERY_REPO_CONFIG = {
  fields: {
    blocked_by: {
      to: 'decision',
      type: 'ref',
    },
    decided_by: {
      to: 'decision',
      type: 'ref',
    },
    implements_command: {
      to: 'command',
      type: 'ref',
    },
    command: {
      hidden: true,
      on: ['command'],
      type: 'string',
    },
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
    term: {
      hidden: true,
      on: ['term'],
      type: 'string',
    },
    tracked_in: {
      to: 'document',
      type: 'ref',
    },
  },
  include: [],
  queries: {},
  types: {
    command: {
      label: 'Command',
      defined_by: 'command',
    },
    decision: {
      label: 'Decision',
      in: ['docs/decisions/**/*.md'],
    },
    plan: {
      label: 'Plan',
      in: ['docs/plans/**/*.md'],
    },
    roadmap: {
      label: 'Roadmap',
      in: ['docs/roadmap/**/*.md'],
    },
    task: {
      label: 'Task',
      in: ['docs/tasks/**/*.md'],
    },
    term: {
      label: 'Term',
      defined_by: 'term',
    },
  },
};

it('filters graph nodes by equality clauses', () => {
  const query_result = queryGraph(
    createQueryGraph(),
    "MATCH (n:Task) WHERE n.status = 'pending' RETURN n",
    QUERY_REPO_CONFIG,
  );

  expect(query_result.diagnostics).toEqual([]);
  expect(query_result.nodes.map((graph_node) => graph_node.id)).toEqual([
    'doc:docs/tasks/v0/query-command.md',
  ]);
  expect(query_result.total_count).toBe(1);
});

it('filters graph nodes by Cypher property predicates', () => {
  const query_result = queryGraph(
    createQueryGraph(),
    "MATCH (n:Task) WHERE n.status = 'pending' RETURN n",
    QUERY_REPO_CONFIG,
  );

  expect(query_result.diagnostics).toEqual([]);
  expect(query_result.nodes.map((graph_node) => graph_node.id)).toEqual([
    'doc:docs/tasks/v0/query-command.md',
  ]);
  expect(query_result.total_count).toBe(1);
});

it('filters graph nodes by structural identity functions', () => {
  const query_result = queryGraph(
    createQueryGraph(),
    "MATCH (n:Decision) WHERE id(n) = 'doc:docs/decisions/query-language-v0.md' OR path(n) ENDS WITH '/show-output-v0.md' RETURN n",
    QUERY_REPO_CONFIG,
  );

  expect(query_result.diagnostics).toEqual([]);
  expect(query_result.nodes.map((graph_node) => graph_node.id)).toEqual([
    'doc:docs/decisions/query-language-v0.md',
    'doc:docs/decisions/show-output-v0.md',
  ]);
});

it('filters graph nodes by path prefix and title text', () => {
  const query_result = queryGraph(
    createQueryGraph(),
    "MATCH (n) WHERE path(n) STARTS WITH 'docs/decisions/' AND n.title CONTAINS 'Query' RETURN n",
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
    'MATCH (n) WHERE EXISTS { MATCH (n)-[:BLOCKED_BY]->(blocked) } RETURN n',
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
    "MATCH (n) WHERE EXISTS { MATCH (n)-[:IMPLEMENTS_COMMAND]->(command:Command) WHERE id(command) = 'command:query' } RETURN n",
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
    'MATCH (n) WHERE EXISTS { MATCH (n)-[:IMPLEMENTS_COMMAND]->(command:Command) WHERE id(command) = @command } RETURN n',
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
    "MATCH (n) WHERE path(n) STARTS WITH 'docs/' AND NOT EXISTS { MATCH (n)-[:IMPLEMENTS_COMMAND]->(command:Command) WHERE id(command) = 'command:query' } RETURN n",
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
    "MATCH (n) WHERE path(n) = 'docs/tasks/v0/show-command.md' RETURN n",
    QUERY_REPO_CONFIG,
  );

  expect(query_result.diagnostics).toEqual([]);
  expect(query_result.nodes.map((graph_node) => graph_node.id)).toEqual([
    'doc:docs/tasks/v0/show-command.md',
  ]);
});

it('filters graph nodes by path suffix', () => {
  const query_result = queryGraph(
    createQueryGraph(),
    "MATCH (n) WHERE path(n) ENDS WITH '/query-command.md' RETURN n",
    QUERY_REPO_CONFIG,
  );

  expect(query_result.diagnostics).toEqual([]);
  expect(query_result.nodes.map((graph_node) => graph_node.id)).toEqual([
    'doc:docs/tasks/v0/query-command.md',
  ]);
});

it('filters graph nodes by filename-like path suffix', () => {
  const query_result = queryGraph(
    createQueryGraph(),
    "MATCH (n) WHERE path(n) ENDS WITH '/query.md' RETURN n",
    QUERY_REPO_CONFIG,
  );

  expect(query_result.diagnostics).toEqual([]);
  expect(query_result.nodes.map((graph_node) => graph_node.id)).toEqual([
    'command:query',
  ]);
});

it('does not match path suffix predicates on nodes without a path', () => {
  const query_result = queryGraph(
    /** @type {BuildGraphResult} */ ({
      edges: [],
      nodes: {
        'doc:docs/README.md': {
          $class: 'document',
          $id: 'doc:docs/README.md',
          $path: 'docs/README.md',
          id: 'doc:docs/README.md',
          kind: 'document',
          path: 'docs/README.md',
          title: 'README',
        },
        'virtual:README.md': {
          $class: 'document',
          $id: 'virtual:README.md',
          id: 'virtual:README.md',
          kind: 'document',
          title: 'README',
        },
      },
    }),
    "MATCH (n) WHERE path(n) ENDS WITH '/README.md' RETURN n",
    QUERY_REPO_CONFIG,
  );

  expect(query_result.diagnostics).toEqual([]);
  expect(query_result.nodes.map((graph_node) => graph_node.id)).toEqual([
    'doc:docs/README.md',
  ]);
});

it('filters graph nodes by semantic id', () => {
  const query_result = queryGraph(
    createQueryGraph(),
    "MATCH (n) WHERE id(n) = 'command:query' RETURN n",
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
    "MATCH (n) WHERE id(n) STARTS WITH 'command:' RETURN n",
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
    'MATCH (n:Task) WHERE NOT EXISTS { MATCH (n)-[:BLOCKED_BY]->(blocked) } RETURN n',
    QUERY_REPO_CONFIG,
  );

  expect(query_result.diagnostics).toEqual([]);
  expect(query_result.nodes.map((graph_node) => graph_node.id)).toEqual([
    'doc:docs/tasks/v0/query-command.md',
  ]);
});

it('filters graph nodes by incoming traversal with subquery predicates', () => {
  const query_result = queryGraph(
    createAggregateQueryGraph(),
    "MATCH (n:Decision) WHERE NOT EXISTS { MATCH (task:Task)-[:DECIDED_BY]->(n) WHERE task.status NOT IN ['done', 'dropped', 'superseded'] } RETURN n",
    QUERY_REPO_CONFIG,
  );

  expect(query_result.diagnostics).toEqual([]);
  expect(query_result.nodes.map((graph_node) => graph_node.id)).toEqual([
    'doc:docs/decisions/finished-rollup.md',
    'doc:docs/decisions/orphan-rollup.md',
  ]);
});

it('filters graph nodes by Cypher count subqueries', () => {
  const query_result = queryGraph(
    createAggregateQueryGraph(),
    "MATCH (n:Decision) WHERE n.status = 'accepted' AND COUNT { MATCH (task:Task)-[:DECIDED_BY]->(n) WHERE task.status NOT IN ['done', 'dropped', 'superseded'] } = 0 RETURN n",
    QUERY_REPO_CONFIG,
  );

  expect(query_result.diagnostics).toEqual([]);
  expect(query_result.nodes.map((graph_node) => graph_node.id)).toEqual([
    'doc:docs/decisions/finished-rollup.md',
    'doc:docs/decisions/orphan-rollup.md',
  ]);
});

it('filters graph nodes by Cypher exists subqueries', () => {
  const query_result = queryGraph(
    createQueryGraph(),
    'MATCH (n:Document) WHERE EXISTS { MATCH (n)-[:IMPLEMENTS_COMMAND]->(command:Command) WHERE id(command) = "command:query" } RETURN n',
    QUERY_REPO_CONFIG,
  );

  expect(query_result.diagnostics).toEqual([]);
  expect(query_result.nodes.map((graph_node) => graph_node.id)).toEqual([
    'doc:lib/cli/main.js',
  ]);
});

it('returns Cypher syntax diagnostics', () => {
  const query_result = queryGraph(
    createQueryGraph(),
    'MATCH (n RETURN n',
    QUERY_REPO_CONFIG,
  );

  expect(query_result.nodes).toEqual([]);
  expect(query_result.total_count).toBe(0);
  expect(query_result.diagnostics).toEqual([
    expect.objectContaining({
      code: 'query.invalid',
      path: '<query>',
    }),
  ]);
});

it('filters graph nodes by outgoing traversal aggregates', () => {
  const query_result = queryGraph(
    createAggregateQueryGraph(),
    "MATCH (n:Task) WHERE EXISTS { MATCH (n)-[:TRACKED_IN]->(plan:Plan) WHERE plan.status = 'active' } RETURN n",
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
    "MATCH (n:Roadmap) WHERE NOT EXISTS { MATCH (plan:Plan)-[:TRACKED_IN]->(n) WHERE plan.status = 'active' } RETURN n",
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
    'MATCH (n:Decision) WHERE COUNT { MATCH (task:Task)-[:DECIDED_BY]->(n) } = 0 RETURN n',
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
    "MATCH (n) WHERE path(n) STARTS WITH 'docs/tasks/' OR n.status = 'accepted' AND n.title CONTAINS 'Show' RETURN n",
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
    'RETURN n',
    QUERY_REPO_CONFIG,
  );

  expect(query_result.nodes).toEqual([]);
  expect(query_result.diagnostics).toEqual([
    {
      code: 'query.invalid',
      column: 8,
      level: 'error',
      line: 1,
      message: 'Expected the MATCH keyword.',
      path: '<query>',
    },
  ]);
});

it('filters graph nodes by explicit grouping', () => {
  const query_result = queryGraph(
    createQueryGraph(),
    "MATCH (n) WHERE (path(n) STARTS WITH 'docs/tasks/' OR n.status = 'accepted') AND n.title CONTAINS 'Show' RETURN n",
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
    "MATCH (n:Decision) WHERE NOT EXISTS { MATCH (task:Task)-[:DECIDED_BY]->(n) WHERE task.status = 'done' OR task.status = 'dropped' } RETURN n",
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
    "MATCH (n) WHERE n.owner = 'max' RETURN n",
    QUERY_REPO_CONFIG,
  );

  expect(query_result.nodes).toEqual([]);
  expect(query_result.diagnostics).toEqual([
    {
      code: 'query.unknown_field',
      column: 19,
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
      message: 'Expected the MATCH keyword.',
      path: '<query>',
    },
  ]);
});

it('reports a trailing boolean operator', () => {
  const query_result = queryGraph(
    createQueryGraph(),
    "MATCH (n) WHERE id(n) = 'command:query' OR RETURN n",
    QUERY_REPO_CONFIG,
  );

  expect(query_result.nodes).toEqual([]);
  expect(query_result.diagnostics).toEqual([
    expect.objectContaining({
      code: 'query.invalid',
      path: '<query>',
    }),
  ]);
});

it('reports a trailing operator', () => {
  const query_result = queryGraph(
    createQueryGraph(),
    "MATCH (n) WHERE id(n) = 'command:query' AND RETURN n",
    QUERY_REPO_CONFIG,
  );

  expect(query_result.nodes).toEqual([]);
  expect(query_result.diagnostics).toEqual([
    expect.objectContaining({
      code: 'query.invalid',
      path: '<query>',
    }),
  ]);
});

it('applies offset and limit after sorting matches', () => {
  const query_result = queryGraph(
    createQueryGraph(),
    "MATCH (n) WHERE path(n) STARTS WITH 'docs/' RETURN n",
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
    'MATCH (n) WHERE path(n) STARTS WITH @docs_path RETURN n',
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
    queryGraph(
      comparison_graph,
      'MATCH (n) WHERE n.priority < 2 RETURN n',
      comparison_repo_config,
    ).nodes,
  ).toEqual([comparison_graph.nodes.blank, comparison_graph.nodes.low]);
  expect(
    queryGraph(
      comparison_graph,
      'MATCH (n) WHERE n.priority <= 2 RETURN n',
      comparison_repo_config,
    ).nodes,
  ).toEqual([
    comparison_graph.nodes.blank,
    comparison_graph.nodes.low,
    comparison_graph.nodes.mid,
  ]);
  expect(
    queryGraph(
      comparison_graph,
      'MATCH (n) WHERE n.priority > 2 RETURN n',
      comparison_repo_config,
    ).nodes,
  ).toEqual([comparison_graph.nodes.high]);
  expect(
    queryGraph(
      comparison_graph,
      'MATCH (n) WHERE n.priority >= 2 RETURN n',
      comparison_repo_config,
    ).nodes,
  ).toEqual([comparison_graph.nodes.high, comparison_graph.nodes.mid]);
  expect(
    queryGraph(
      comparison_graph,
      'MATCH (n) WHERE n.priority <> 2 RETURN n',
      comparison_repo_config,
    ).nodes,
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
      'MATCH (n:Decision) WHERE COUNT { MATCH (task:Task)-[:DECIDED_BY]->(n) } <> 0 RETURN n',
      QUERY_REPO_CONFIG,
    ).nodes.map((graph_node) => graph_node.id),
  ).toEqual([
    'doc:docs/decisions/active-rollup.md',
    'doc:docs/decisions/finished-rollup.md',
  ]);
  expect(
    queryGraph(
      createAggregateQueryGraph(),
      'MATCH (n:Decision) WHERE COUNT { MATCH (task:Task)-[:DECIDED_BY]->(n) } < 1 RETURN n',
      QUERY_REPO_CONFIG,
    ).nodes.map((graph_node) => graph_node.id),
  ).toEqual(['doc:docs/decisions/orphan-rollup.md']);
  expect(
    queryGraph(
      createAggregateQueryGraph(),
      'MATCH (n:Decision) WHERE COUNT { MATCH (task:Task)-[:DECIDED_BY]->(n) } <= 1 RETURN n',
      QUERY_REPO_CONFIG,
    ).nodes.map((graph_node) => graph_node.id),
  ).toEqual(['doc:docs/decisions/orphan-rollup.md']);
  expect(
    queryGraph(
      createAggregateQueryGraph(),
      'MATCH (n:Decision) WHERE COUNT { MATCH (task:Task)-[:DECIDED_BY]->(n) } > 1 RETURN n',
      QUERY_REPO_CONFIG,
    ).nodes.map((graph_node) => graph_node.id),
  ).toEqual([
    'doc:docs/decisions/active-rollup.md',
    'doc:docs/decisions/finished-rollup.md',
  ]);
  expect(
    queryGraph(
      createAggregateQueryGraph(),
      'MATCH (n:Decision) WHERE COUNT { MATCH (task:Task)-[:DECIDED_BY]->(n) } >= 2 RETURN n',
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
    'MATCH (n) WHERE id(n) = @command RETURN n',
    QUERY_REPO_CONFIG,
  );

  expect(query_result.nodes).toEqual([]);
  expect(query_result.diagnostics).toEqual([
    {
      code: 'query.invalid',
      column: 34,
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
