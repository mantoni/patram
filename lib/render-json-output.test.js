/**
 * @import { OutputView } from './output-view.types.ts';
 */
import { expect, it } from 'vitest';

import { renderJsonOutput } from './render-json-output.js';

const EXPECTED_QUERY_JSON_OUTPUT =
  '{\n' +
  '  "results": [\n' +
  '    {\n' +
  '      "$class": "task",\n' +
  '      "$id": "task:pending",\n' +
  '      "fields": {\n' +
  '        "status": "pending"\n' +
  '      },\n' +
  '      "title": "Pending Task"\n' +
  '    }\n' +
  '  ],\n' +
  '  "summary": {\n' +
  '    "shown_count": 1,\n' +
  '    "total_count": 1,\n' +
  '    "offset": 0,\n' +
  '    "limit": 25\n' +
  '  },\n' +
  '  "hints": []\n' +
  '}\n';

const EXPECTED_SHOW_JSON_OUTPUT =
  '{\n' +
  '  "source": "# Patram",\n' +
  '  "resolved_links": [\n' +
  '    {\n' +
  '      "reference": 1,\n' +
  '      "label": "Decision",\n' +
  '      "target": {\n' +
  '        "$class": "decision",\n' +
  '        "$id": "decision:query-language",\n' +
  '        "fields": {},\n' +
  '        "title": "Query Language"\n' +
  '      }\n' +
  '    }\n' +
  '  ]\n' +
  '}\n';

it('renders query output without a path', () => {
  expect(
    renderJsonOutput({
      command: 'query',
      hints: [],
      items: [
        {
          derived_summary: undefined,
          fields: {
            status: 'pending',
          },
          id: 'task:pending',
          kind: 'node',
          node_kind: 'task',
          title: 'Pending Task',
          visible_fields: [],
        },
      ],
      summary: {
        count: 1,
        kind: 'result_list',
        limit: 25,
        offset: 0,
        total_count: 1,
      },
    }),
  ).toBe(EXPECTED_QUERY_JSON_OUTPUT);
});

it('renders show output without a document summary', () => {
  expect(
    renderJsonOutput({
      command: 'show',
      document: undefined,
      hints: [],
      items: [
        {
          kind: 'resolved_link',
          label: 'Decision',
          reference: 1,
          target: {
            fields: {},
            id: 'decision:query-language',
            kind: 'decision',
            title: 'Query Language',
            visible_fields: [],
          },
        },
      ],
      path: 'docs/patram.md',
      rendered_source: '',
      source: '# Patram',
      summary: {
        count: 1,
        kind: 'resolved_link_list',
      },
    }),
  ).toBe(EXPECTED_SHOW_JSON_OUTPUT);
});

it('renders show document paths in JSON output', () => {
  expect(
    JSON.parse(
      renderJsonOutput({
        command: 'show',
        document: {
          fields: {
            status: 'active',
          },
          id: 'doc:docs/patram.md',
          kind: 'node',
          node_kind: 'document',
          path: 'docs/patram.md',
          title: 'Patram',
          visible_fields: [],
        },
        hints: [],
        items: [],
        path: 'docs/patram.md',
        rendered_source: '',
        source: '# Patram',
        summary: {
          count: 0,
          kind: 'resolved_link_list',
        },
      }),
    ),
  ).toEqual({
    document: {
      $class: 'document',
      $id: 'doc:docs/patram.md',
      $path: 'docs/patram.md',
      fields: {
        status: 'active',
      },
      title: 'Patram',
    },
    resolved_links: [],
    source: '# Patram',
  });
});

it('throws for unsupported output view commands', () => {
  expect(() =>
    renderJsonOutput(
      /** @type {OutputView} */ (
        /** @type {unknown} */ ({
          command: 'invalid',
        })
      ),
    ),
  ).toThrow('Unsupported output view command.');
});
