import { expect, it } from 'vitest';

import { createDerivedSummaryEvaluator } from './derived-summary.js';
import {
  createDerivedSummaryGraphFixture,
  createDerivedSummaryRepoConfigFixture,
} from './derived-summary.test-helpers.js';
import { renderJsonOutput } from './render-json-output.js';
import { renderPlainOutput } from './render-plain-output.js';
import {
  createOutputView,
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

it('renders the shown document self-summary before resolved links', () => {
  const graph = createDerivedSummaryGraphFixture();
  const derived_summary_evaluator = createDerivedSummaryEvaluator(
    createDerivedSummaryRepoConfigFixture(),
    graph,
  );
  const output_view = createShowOutputView(
    {
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
  'plan docs/plans/v0/query-traversal-and-aggregation.md\n' +
  'status: active\n' +
  'execution: done  open_tasks: 0  blocked_tasks: 0  total_tasks: 2\n' +
  '\n' +
  '    Query Traversal And Aggregation Plan\n';

const EXPECTED_SHOW_PLAIN_OUTPUT =
  '# Query Traversal And Aggregation Plan\n' +
  '\n' +
  'See [Decision][1].\n' +
  '\n' +
  '----------------\n' +
  'plan docs/plans/v0/query-traversal-and-aggregation.md\n' +
  'status: active\n' +
  'execution: done  open_tasks: 0  blocked_tasks: 0  total_tasks: 2\n' +
  '\n' +
  '    Query Traversal And Aggregation Plan\n' +
  '\n' +
  '[1] decision docs/decisions/query-traversal-and-aggregation.md\n' +
  '    status: accepted\n' +
  '    execution: done  open_tasks: 0  blocked_tasks: 0  total_tasks: 2\n' +
  '\n' +
  '    Query Traversal And Aggregation Decision\n';

const EXPECTED_SHOW_JSON_OUTPUT = {
  document: {
    $class: 'plan',
    $id: 'doc:docs/plans/v0/query-traversal-and-aggregation.md',
    $path: 'docs/plans/v0/query-traversal-and-aggregation.md',
    derived: {
      blocked_tasks: 0,
      execution: 'done',
      open_tasks: 0,
      total_tasks: 2,
    },
    derived_summary: 'plan_execution',
    fields: {
      status: 'active',
    },
    title: 'Query Traversal And Aggregation Plan',
  },
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
