import ansis from 'ansis';
import { expect, it } from 'vitest';

import { createDerivedSummaryEvaluator } from './derived-summary.js';
import {
  createDerivedSummaryGraphFixture,
  createDerivedSummaryRepoConfigFixture,
} from './derived-summary.test-helpers.js';
import { renderJsonOutput } from './renderers/json.js';
import { renderPlainOutput } from './renderers/plain.js';
import { renderRichOutput } from './renderers/rich.js';
import {
  createOutputView,
  createRefsOutputView,
  createShowOutputView,
} from './render-output-view.js';

it('renders derived summary metadata in query output', () => {
  const graph = createDerivedSummaryGraphFixture();
  const derived_summary_evaluator = createDerivedSummaryEvaluator(
    createDerivedSummaryRepoConfigFixture(),
    graph,
  );
  const output_view = createOutputView(
    'query',
    [
      {
        $class: 'plan',
        $id: 'doc:docs/plans/v0/query-traversal-and-aggregation.md',
        $path: 'docs/plans/v0/query-traversal-and-aggregation.md',
        id: 'doc:docs/plans/v0/query-traversal-and-aggregation.md',
        path: 'docs/plans/v0/query-traversal-and-aggregation.md',
        status: 'active',
        title: 'Query Traversal And Aggregation Plan',
      },
    ],
    {
      derived_summary_evaluator,
      repo_config: createDerivedSummaryRepoConfigFixture(),
    },
  );

  expect(renderPlainOutput(output_view)).toBe(EXPECTED_QUERY_PLAIN_OUTPUT);
  expect(renderJsonOutput(output_view)).toBe(EXPECTED_QUERY_JSON_OUTPUT);
});

it('renders derived summary metadata in refs output', () => {
  const graph = createDerivedSummaryGraphFixture();
  const derived_summary_evaluator = createDerivedSummaryEvaluator(
    createDerivedSummaryRepoConfigFixture(),
    graph,
  );
  const output_view = createRefsOutputView(
    {
      incoming: {
        tracked_in: [
          graph.nodes['doc:docs/tasks/v0/query-traversal-task-1.md'],
        ],
      },
      node: graph.nodes['doc:docs/plans/v0/query-traversal-and-aggregation.md'],
    },
    {
      derived_summary_evaluator,
      repo_config: createDerivedSummaryRepoConfigFixture(),
    },
  );

  expect(renderPlainOutput(output_view)).toBe(EXPECTED_REFS_PLAIN_OUTPUT);
});

it('renders derived summaries for show resolved links without a self-summary block', () => {
  const graph = createDerivedSummaryGraphFixture();
  const derived_summary_evaluator = createDerivedSummaryEvaluator(
    createDerivedSummaryRepoConfigFixture(),
    graph,
  );
  const output_view = createShowOutputView(
    {
      incoming_summary: {},
      path: 'docs/plans/v0/query-traversal-and-aggregation.md',
      rendered_source:
        '# Query Traversal And Aggregation Plan\n\nSee [Decision][1].',
      resolved_links: [
        {
          label: 'Decision',
          reference: 1,
          target: {
            kind: 'decision',
            path: 'docs/decisions/query-traversal-and-aggregation.md',
            status: 'accepted',
            title: 'Query Traversal And Aggregation Decision',
          },
        },
      ],
      source:
        '# Query Traversal And Aggregation Plan\n\nSee [Decision](../decisions/query-traversal-and-aggregation.md).\n',
    },
    {
      derived_summary_evaluator,
      graph_nodes: graph.nodes,
      repo_config: createDerivedSummaryRepoConfigFixture(),
    },
  );

  expect(renderPlainOutput(output_view)).toBe(EXPECTED_SHOW_PLAIN_OUTPUT);
  expect(JSON.parse(renderJsonOutput(output_view))).toEqual(
    EXPECTED_SHOW_JSON_OUTPUT,
  );
});

it('renders derived summary labels and inline metadata punctuation in rich output', async () => {
  const graph = createDerivedSummaryGraphFixture();
  const derived_summary_evaluator = createDerivedSummaryEvaluator(
    createDerivedSummaryRepoConfigFixture(),
    graph,
  );
  const output_view = createOutputView(
    'query',
    [graph.nodes['doc:docs/plans/v0/query-traversal-and-aggregation.md']],
    {
      derived_summary_evaluator,
      repo_config: createDerivedSummaryRepoConfigFixture(),
    },
  );
  const rich_output = await renderRichOutput(output_view, {
    color_enabled: true,
    color_mode: 'always',
  });

  expect(stripAnsi(rich_output)).toBe(EXPECTED_QUERY_PLAIN_OUTPUT);
  expect(rich_output).toContain(ansis.gray('summary:'));
  expect(rich_output).toContain(ansis.gray('('));
  expect(rich_output).toContain(ansis.gray('='));
  expect(rich_output).toContain(ansis.gray(')'));
});

const EXPECTED_QUERY_JSON_OUTPUT =
  '{\n' +
  '  "results": [\n' +
  '    {\n' +
  '      "$class": "plan",\n' +
  '      "$id": "doc:docs/plans/v0/query-traversal-and-aggregation.md",\n' +
  '      "fields": {\n' +
  '        "status": "active"\n' +
  '      },\n' +
  '      "title": "Query Traversal And Aggregation Plan",\n' +
  '      "$path": "docs/plans/v0/query-traversal-and-aggregation.md",\n' +
  '      "derived_summary": "plan_execution",\n' +
  '      "derived": {\n' +
  '        "execution": "done",\n' +
  '        "open_tasks": 0,\n' +
  '        "blocked_tasks": 0,\n' +
  '        "total_tasks": 2\n' +
  '      }\n' +
  '    }\n' +
  '  ],\n' +
  '  "summary": {\n' +
  '    "shown_count": 1,\n' +
  '    "total_count": 1,\n' +
  '    "offset": 0,\n' +
  '    "limit": 1\n' +
  '  },\n' +
  '  "hints": []\n' +
  '}\n';

const EXPECTED_QUERY_PLAIN_OUTPUT =
  'plan docs/plans/v0/query-traversal-and-aggregation.md  (status=active)\n' +
  '  summary: execution=done  open_tasks=0  blocked_tasks=0  total_tasks=2\n' +
  '  Query Traversal And Aggregation Plan\n';

const EXPECTED_REFS_PLAIN_OUTPUT =
  'plan docs/plans/v0/query-traversal-and-aggregation.md  (status=active)\n' +
  '  summary: execution=done  open_tasks=0  blocked_tasks=0  total_tasks=2\n' +
  '  Query Traversal And Aggregation Plan\n' +
  '\n' +
  'tracked_in (1)\n' +
  '  task docs/tasks/v0/query-traversal-task-1.md  (status=done)\n' +
  '    Task 1\n';

const EXPECTED_SHOW_PLAIN_OUTPUT =
  '# Query Traversal And Aggregation Plan\n' +
  '\n' +
  'See [Decision][1].\n' +
  '\n' +
  '----------------\n' +
  '[1] decision docs/decisions/query-traversal-and-aggregation.md  (status=accepted)\n' +
  '    summary: execution=done  open_tasks=0  blocked_tasks=0  total_tasks=2\n' +
  '    Query Traversal And Aggregation Decision\n';

const EXPECTED_SHOW_JSON_OUTPUT = {
  incoming_summary: {},
  resolved_links: [
    {
      label: 'Decision',
      reference: 1,
      target: {
        $class: 'decision',
        $id: 'doc:docs/decisions/query-traversal-and-aggregation.md',
        $path: 'docs/decisions/query-traversal-and-aggregation.md',
        derived: {
          blocked_tasks: 0,
          execution: 'done',
          open_tasks: 0,
          total_tasks: 2,
        },
        derived_summary: 'decision_execution',
        fields: {
          status: 'accepted',
        },
        title: 'Query Traversal And Aggregation Decision',
      },
    },
  ],
  source:
    '# Query Traversal And Aggregation Plan\n\nSee [Decision](../decisions/query-traversal-and-aggregation.md).\n',
};

/**
 * @param {string} value
 * @returns {string}
 */
function stripAnsi(value) {
  return ansis.strip(value);
}
