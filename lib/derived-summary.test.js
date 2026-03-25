import { expect, it } from 'vitest';

import { createDerivedSummaryEvaluator } from './derived-summary.js';
import {
  createDerivedSummaryGraphFixture,
  createDerivedSummaryRepoConfigFixture,
} from './derived-summary.test-helpers.js';

it('evaluates configured derived summary fields in order for a matching node', () => {
  const derived_summary_evaluator = createDerivedSummaryEvaluator(
    createDerivedSummaryRepoConfigFixture(),
    createDerivedSummaryGraphFixture(),
  );

  expect(
    derived_summary_evaluator.evaluate({
      $class: 'plan',
      $id: 'doc:docs/plans/v0/query-traversal-and-aggregation.md',
      $path: 'docs/plans/v0/query-traversal-and-aggregation.md',
      id: 'doc:docs/plans/v0/query-traversal-and-aggregation.md',
      path: 'docs/plans/v0/query-traversal-and-aggregation.md',
      status: 'active',
      title: 'Query Traversal And Aggregation Plan',
    }),
  ).toEqual({
    fields: [
      {
        name: 'execution',
        value: 'done',
      },
      {
        name: 'open_tasks',
        value: 0,
      },
      {
        name: 'blocked_tasks',
        value: 0,
      },
      {
        name: 'total_tasks',
        value: 2,
      },
    ],
    name: 'plan_execution',
  });
});

it('returns null when no configured summary matches the node kind', () => {
  const derived_summary_evaluator = createDerivedSummaryEvaluator(
    createDerivedSummaryRepoConfigFixture(),
    createDerivedSummaryGraphFixture(),
  );

  expect(
    derived_summary_evaluator.evaluate({
      $class: 'task',
      $id: 'doc:docs/tasks/v0/query-traversal-task-1.md',
      $path: 'docs/tasks/v0/query-traversal-task-1.md',
      id: 'doc:docs/tasks/v0/query-traversal-task-1.md',
      path: 'docs/tasks/v0/query-traversal-task-1.md',
      status: 'done',
      title: 'Task 1',
    }),
  ).toBeNull();
});

it('returns null when derived summaries are not configured', () => {
  const derived_summary_evaluator = createDerivedSummaryEvaluator(
    {
      classes: {
        document: {
          builtin: true,
        },
      },
      include: ['**/*'],
      queries: {},
    },
    createMinimalDerivedSummaryGraph(),
  );

  expect(
    derived_summary_evaluator.evaluate({
      id: 'doc:docs/example.md',
      path: 'docs/example.md',
      title: 'Example',
    }),
  ).toBeNull();
});

it('returns zero counts when a traversal has no matching targets', () => {
  const derived_summary_evaluator = createDerivedSummaryEvaluator(
    createCountSummaryRepoConfig('out:tracked_in', '$class=task'),
    createMinimalDerivedSummaryGraph(),
  );

  expect(
    derived_summary_evaluator.evaluate({
      $class: 'plan',
      id: 'plan:example',
      path: 'docs/plans/v0/example.md',
      title: 'Example Plan',
    }),
  ).toEqual({
    fields: [
      {
        name: 'matches',
        value: 0,
      },
    ],
    name: 'plan_counts',
  });
});

it('uses select defaults when no select case matches the node', () => {
  const derived_summary_evaluator = createDerivedSummaryEvaluator(
    createSelectSummaryRepoConfig(),
    createMinimalDerivedSummaryGraph(),
  );

  expect(
    derived_summary_evaluator.evaluate({
      $class: 'plan',
      id: 'plan:example',
      path: 'docs/plans/v0/example.md',
      status: 'draft',
      title: 'Example Plan',
    }),
  ).toEqual({
    fields: [
      {
        name: 'execution',
        value: 'not_started',
      },
    ],
    name: 'plan_status',
  });
});

it('counts outgoing traversals and caches query results', () => {
  const derived_summary_evaluator = createDerivedSummaryEvaluator(
    createCountSummaryRepoConfig('out:tracked_in', '$class=task'),
    createCountSummaryGraph(),
  );
  const graph_node = {
    $class: 'plan',
    id: 'plan:example',
    path: 'docs/plans/v0/example.md',
    title: 'Example Plan',
  };

  expect(derived_summary_evaluator.evaluate(graph_node)).toEqual({
    fields: [
      {
        name: 'matches',
        value: 1,
      },
    ],
    name: 'plan_counts',
  });
  expect(derived_summary_evaluator.evaluate(graph_node)).toEqual({
    fields: [
      {
        name: 'matches',
        value: 1,
      },
    ],
    name: 'plan_counts',
  });
});

it('throws when a derived summary query is invalid', () => {
  const derived_summary_evaluator = createDerivedSummaryEvaluator(
    createCountSummaryRepoConfig('out:tracked_in', '$class'),
    createCountSummaryGraph(),
  );

  expect(() => {
    derived_summary_evaluator.evaluate({
      $class: 'plan',
      id: 'plan:example',
      path: 'docs/plans/v0/example.md',
      title: 'Example Plan',
    });
  }).toThrow('Expected derived summary query "$class" to be valid.');
});

it('throws when a derived summary traversal is invalid', () => {
  const derived_summary_evaluator = createDerivedSummaryEvaluator(
    createCountSummaryRepoConfig('sideways:tracked_in', '$class=task'),
    createCountSummaryGraph(),
  );

  expect(() => {
    derived_summary_evaluator.evaluate({
      $class: 'plan',
      id: 'plan:example',
      path: 'docs/plans/v0/example.md',
      title: 'Example Plan',
    });
  }).toThrow('Invalid derived summary traversal "sideways:tracked_in".');
});

function createMinimalDerivedSummaryGraph() {
  return {
    document_node_ids: {},
    edges: [],
    nodes: {},
  };
}

function createCountSummaryGraph() {
  return {
    document_node_ids: {},
    edges: [
      {
        from: 'plan:example',
        id: 'edge:1',
        origin: {
          column: 1,
          line: 1,
          path: 'docs/plans/v0/example.md',
        },
        relation: 'tracked_in',
        to: 'task:done',
      },
    ],
    nodes: {
      'plan:example': {
        $class: 'plan',
        id: 'plan:example',
        path: 'docs/plans/v0/example.md',
        title: 'Example Plan',
      },
      'task:done': {
        $class: 'task',
        id: 'task:done',
        path: 'docs/tasks/v0/done.md',
        status: 'done',
        title: 'Done Task',
      },
    },
  };
}

/**
 * @param {string} traversal
 * @param {string} where_clause
 */
function createCountSummaryRepoConfig(traversal, where_clause) {
  return {
    classes: {
      document: {
        builtin: true,
      },
      plan: {
        label: 'Plan',
      },
      task: {
        label: 'Task',
      },
    },
    derived_summaries: {
      plan_counts: {
        classes: ['plan'],
        fields: [
          {
            count: {
              traversal,
              where: where_clause,
            },
            name: 'matches',
          },
        ],
      },
    },
    include: ['**/*'],
    queries: {},
  };
}

function createSelectSummaryRepoConfig() {
  return {
    classes: {
      document: {
        builtin: true,
      },
      plan: {
        label: 'Plan',
      },
    },
    derived_summaries: {
      plan_status: {
        classes: ['plan'],
        fields: [
          {
            default: 'not_started',
            name: 'execution',
            select: [
              {
                value: 'done',
                when: 'status=done',
              },
            ],
          },
        ],
      },
    },
    include: ['**/*'],
    queries: {},
  };
}
