/** @import * as $k$$l$output$j$view$k$types$k$ts from './output-view.types.ts'; */
import { expect, it } from 'vitest';

import { layoutIncomingReferenceLines } from './layout-incoming-references.js';

it('lays out incoming references with the default block formatting', () => {
  expect(
    layoutIncomingReferenceLines({
      links_to: [
        createOutputNodeItem({
          path: 'docs/a.md',
          title: 'Document A',
        }),
        createOutputNodeItem({
          path: 'docs/b.md',
          title: 'Task B',
          visible_fields: [
            {
              name: 'status',
              value: 'ready',
            },
          ],
        }),
      ],
      uses_term: [
        createOutputNodeItem({
          node_kind: 'term',
          path: 'docs/reference/terms/graph.md',
          title: 'graph',
        }),
      ],
    }),
  ).toEqual([
    'links_to (2)',
    '  ├─ document docs/a.md',
    '  │    Document A',
    '  └─ document docs/b.md  (status=ready)',
    '       Task B',
    '',
    'uses_term (1)',
    '  └─ term docs/reference/terms/graph.md',
    '       graph',
  ]);
});

it('uses a custom node header formatter when provided', () => {
  expect(
    layoutIncomingReferenceLines(
      {
        links_to: [
          createOutputNodeItem({
            id: 'doc:docs/a.md',
            path: 'docs/a.md',
            title: 'Document A',
          }),
        ],
      },
      {
        format_node_header(output_item) {
          return `node ${output_item.id}`;
        },
      },
    ),
  ).toEqual(['links_to (1)', '  └─ node doc:docs/a.md', '       Document A']);
});

it('uses custom relation and node block formatters when provided', () => {
  expect(
    layoutIncomingReferenceLines(
      {
        links_to: [
          createOutputNodeItem({
            path: 'docs/a.md',
            title: 'Document A',
          }),
        ],
      },
      {
        format_node_block(output_item) {
          return `custom ${output_item.path}\n${output_item.title}`;
        },
        format_relation_header(relation_name, relation_count) {
          return `${relation_count}:${relation_name}`;
        },
      },
    ),
  ).toEqual(['1:links_to', '  └─ custom docs/a.md', '       Document A']);
});

/**
 * @param {{
 *   id?: string,
 *   node_kind?: string,
 *   path: string,
 *   title: string,
 *   visible_fields?: { name: string, value: string | string[] }[],
 * }} options
 * @returns {$k$$l$output$j$view$k$types$k$ts.OutputNodeItem}
 */
function createOutputNodeItem(options) {
  return {
    fields: {},
    id: options.id ?? `doc:${options.path}`,
    kind: 'node',
    node_kind: options.node_kind ?? 'document',
    path: options.path,
    title: options.title,
    visible_fields: options.visible_fields ?? [],
  };
}
