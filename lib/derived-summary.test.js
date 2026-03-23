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
      id: 'doc:docs/plans/v0/query-traversal-and-aggregation.md',
      kind: 'plan',
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
      id: 'doc:docs/tasks/v0/query-traversal-task-1.md',
      kind: 'task',
      path: 'docs/tasks/v0/query-traversal-task-1.md',
      status: 'done',
      title: 'Task 1',
    }),
  ).toBeNull();
});
