/**
 * @import { OutputView } from './output-view.types.ts';
 */
import ansis from 'ansis';
import { expect, it } from 'vitest';

import { renderJsonOutput } from './renderers/json.js';
import { renderPlainOutput } from './renderers/plain.js';
import { renderRichOutput } from './renderers/rich.js';
it('ignores derived summary metadata in query output', async () => {
  const output_view = createQueryOutputView();

  expect(renderPlainOutput(output_view)).toBe(EXPECTED_QUERY_PLAIN_OUTPUT);
  expect(renderJsonOutput(output_view)).toBe(EXPECTED_QUERY_JSON_OUTPUT);
  const rich_output = await renderRichOutput(output_view, {
    color_enabled: true,
    color_mode: 'always',
  });

  expect(stripAnsi(rich_output)).toBe(EXPECTED_QUERY_PLAIN_OUTPUT);
  expect(rich_output).toContain(ansis.gray('('));
  expect(rich_output).toContain(ansis.gray('='));
  expect(rich_output).toContain(ansis.gray(')'));
  expect(rich_output).not.toContain('summary:');
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
  '      "$path": "docs/plans/v0/query-traversal-and-aggregation.md"\n' +
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
  '  Query Traversal And Aggregation Plan\n';

/**
 * @param {string} value
 * @returns {string}
 */
function stripAnsi(value) {
  return ansis.strip(value);
}

/**
 * @returns {OutputView}
 */
function createQueryOutputView() {
  return /** @type {OutputView} */ (
    /** @type {unknown} */ ({
      command: 'query',
      hints: [],
      items: [
        {
          derived_summary: {
            fields: [
              {
                name: 'execution',
                value: 'done',
              },
            ],
            name: 'plan_execution',
          },
          fields: {
            status: 'active',
          },
          id: 'doc:docs/plans/v0/query-traversal-and-aggregation.md',
          kind: 'node',
          node_kind: 'plan',
          path: 'docs/plans/v0/query-traversal-and-aggregation.md',
          title: 'Query Traversal And Aggregation Plan',
          visible_fields: [
            {
              name: 'status',
              value: 'active',
            },
          ],
        },
      ],
      summary: {
        count: 1,
        kind: 'result_list',
        limit: 1,
        offset: 0,
        total_count: 1,
      },
    })
  );
}
