/** @import * as $k$$l$load$j$patram$j$config$k$types$k$ts from './load-patram-config.types.ts'; */
/** @import * as $k$$l$build$j$graph$k$types$k$ts from './build-graph.types.ts'; */
/**
 * @returns {$k$$l$build$j$graph$k$types$k$ts.BuildGraphResult}
 */
export function createDerivedSummaryGraphFixture() {
  return cloneFixture(DERIVED_SUMMARY_GRAPH_FIXTURE);
}

/**
 * @returns {$k$$l$load$j$patram$j$config$k$types$k$ts.PatramRepoConfig}
 */
export function createDerivedSummaryRepoConfigFixture() {
  return cloneFixture(DERIVED_SUMMARY_REPO_CONFIG_FIXTURE);
}

/**
 * @template {object} T
 * @param {T} fixture
 * @returns {T}
 */
function cloneFixture(fixture) {
  return JSON.parse(JSON.stringify(fixture));
}

/** @type {$k$$l$build$j$graph$k$types$k$ts.BuildGraphResult} */
const DERIVED_SUMMARY_GRAPH_FIXTURE = {
  edges: [
    {
      from: 'doc:docs/tasks/v0/query-traversal-task-1.md',
      id: 'edge:1',
      origin: {
        column: 1,
        line: 1,
        path: 'docs/tasks/v0/query-traversal-task-1.md',
      },
      relation: 'tracked_in',
      to: 'doc:docs/plans/v0/query-traversal-and-aggregation.md',
    },
    {
      from: 'doc:docs/tasks/v0/query-traversal-task-2.md',
      id: 'edge:2',
      origin: {
        column: 1,
        line: 1,
        path: 'docs/tasks/v0/query-traversal-task-2.md',
      },
      relation: 'tracked_in',
      to: 'doc:docs/plans/v0/query-traversal-and-aggregation.md',
    },
    {
      from: 'doc:docs/tasks/v0/query-traversal-task-1.md',
      id: 'edge:3',
      origin: {
        column: 1,
        line: 1,
        path: 'docs/tasks/v0/query-traversal-task-1.md',
      },
      relation: 'decided_by',
      to: 'doc:docs/decisions/query-traversal-and-aggregation.md',
    },
    {
      from: 'doc:docs/tasks/v0/query-traversal-task-2.md',
      id: 'edge:4',
      origin: {
        column: 1,
        line: 1,
        path: 'docs/tasks/v0/query-traversal-task-2.md',
      },
      relation: 'decided_by',
      to: 'doc:docs/decisions/query-traversal-and-aggregation.md',
    },
  ],
  nodes: {
    'doc:docs/decisions/query-traversal-and-aggregation.md': {
      $class: 'decision',
      $id: 'doc:docs/decisions/query-traversal-and-aggregation.md',
      $path: 'docs/decisions/query-traversal-and-aggregation.md',
      id: 'doc:docs/decisions/query-traversal-and-aggregation.md',
      path: 'docs/decisions/query-traversal-and-aggregation.md',
      status: 'accepted',
      title: 'Query Traversal And Aggregation Decision',
    },
    'doc:docs/plans/v0/query-traversal-and-aggregation.md': {
      $class: 'plan',
      $id: 'doc:docs/plans/v0/query-traversal-and-aggregation.md',
      $path: 'docs/plans/v0/query-traversal-and-aggregation.md',
      id: 'doc:docs/plans/v0/query-traversal-and-aggregation.md',
      path: 'docs/plans/v0/query-traversal-and-aggregation.md',
      status: 'active',
      title: 'Query Traversal And Aggregation Plan',
    },
    'doc:docs/tasks/v0/query-traversal-task-1.md': {
      $class: 'task',
      $id: 'doc:docs/tasks/v0/query-traversal-task-1.md',
      $path: 'docs/tasks/v0/query-traversal-task-1.md',
      id: 'doc:docs/tasks/v0/query-traversal-task-1.md',
      path: 'docs/tasks/v0/query-traversal-task-1.md',
      status: 'done',
      title: 'Task 1',
    },
    'doc:docs/tasks/v0/query-traversal-task-2.md': {
      $class: 'task',
      $id: 'doc:docs/tasks/v0/query-traversal-task-2.md',
      $path: 'docs/tasks/v0/query-traversal-task-2.md',
      id: 'doc:docs/tasks/v0/query-traversal-task-2.md',
      path: 'docs/tasks/v0/query-traversal-task-2.md',
      status: 'done',
      title: 'Task 2',
    },
  },
};

/** @type {$k$$l$load$j$patram$j$config$k$types$k$ts.PatramRepoConfig} */
const DERIVED_SUMMARY_REPO_CONFIG_FIXTURE = {
  derived_summaries: {
    decision_execution: {
      fields: [
        {
          default: 'not_started',
          name: 'execution',
          select: [
            {
              value: 'done',
              when: 'count(in:decided_by, $class=task) > 0 and none(in:decided_by, $class=task and status not in [done, dropped, superseded])',
            },
          ],
        },
        {
          count: {
            traversal: 'in:decided_by',
            where: '$class=task and status not in [done, dropped, superseded]',
          },
          name: 'open_tasks',
        },
        {
          count: {
            traversal: 'in:decided_by',
            where: '$class=task and status=blocked',
          },
          name: 'blocked_tasks',
        },
        {
          count: {
            traversal: 'in:decided_by',
            where: '$class=task',
          },
          name: 'total_tasks',
        },
      ],
      classes: ['decision'],
    },
    plan_execution: {
      fields: [
        {
          default: 'not_started',
          name: 'execution',
          select: [
            {
              value: 'done',
              when: 'count(in:tracked_in, $class=task) > 0 and none(in:tracked_in, $class=task and status not in [done, dropped, superseded])',
            },
            {
              value: 'blocked',
              when: 'any(in:tracked_in, $class=task and status not in [done, dropped, superseded]) and none(in:tracked_in, $class=task and status not in [done, dropped, superseded] and not status=blocked)',
            },
            {
              value: 'in_progress',
              when: 'any(in:tracked_in, $class=task and not status=pending)',
            },
          ],
        },
        {
          count: {
            traversal: 'in:tracked_in',
            where: '$class=task and status not in [done, dropped, superseded]',
          },
          name: 'open_tasks',
        },
        {
          count: {
            traversal: 'in:tracked_in',
            where: '$class=task and status=blocked',
          },
          name: 'blocked_tasks',
        },
        {
          count: {
            traversal: 'in:tracked_in',
            where: '$class=task',
          },
          name: 'total_tasks',
        },
      ],
      classes: ['plan'],
    },
  },
  fields: {
    status: {
      type: 'enum',
      values: ['accepted', 'active', 'blocked', 'done', 'dropped', 'pending'],
    },
  },
  include: ['docs/**/*.md'],
  queries: {},
  relations: {
    decided_by: {
      from: ['document'],
      to: ['document'],
    },
    tracked_in: {
      from: ['document'],
      to: ['document'],
    },
  },
};
