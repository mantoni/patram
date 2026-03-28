/**
 * @import { PatramConfig } from './patram-config.types.ts';
 */
import { expect, it } from 'vitest';

import { buildGraph } from './build-graph.js';
import { parseClaims } from './parse-claims.js';

/** @type {PatramConfig} */
const WORKTRACKING_RELATION_CONFIG = {
  classes: {
    decision: {
      label: 'Decision',
    },
    document: {
      builtin: true,
    },
  },
  fields: {
    status: {
      type: 'string',
    },
  },
  mappings: {
    'document.title': {
      node: {
        class: 'document',
        field: 'title',
      },
    },
    'markdown.directive.kind': {
      node: {
        class: 'document',
        field: '$class',
      },
    },
    'markdown.directive.status': {
      node: {
        class: 'document',
        field: 'status',
      },
    },
    'markdown.directive.tracked_in': {
      emit: {
        relation: 'tracked_in',
        target: 'path',
        target_class: 'document',
      },
    },
  },
  relations: {
    tracked_in: {
      from: ['document'],
      to: ['document'],
    },
  },
};

it('keeps repo-relative directive targets when the target document is missing', () => {
  const graph = buildGraph(WORKTRACKING_RELATION_CONFIG, [
    ...parseClaims({
      path: 'docs/decisions/query-language.md',
      source: [
        '# Query Language',
        '',
        'Kind: decision',
        'Status: accepted',
        'Tracked in: docs/plans/v0/missing.md',
      ].join('\n'),
    }),
  ]);

  expect(graph.edges).toContainEqual({
    from: 'decision:docs/decisions/query-language.md',
    id: 'edge:1',
    origin: {
      column: 1,
      line: 5,
      path: 'docs/decisions/query-language.md',
    },
    relation: 'tracked_in',
    to: 'doc:docs/plans/v0/missing.md',
  });
  expect(graph.nodes['doc:docs/plans/v0/missing.md']).toEqual({
    $class: 'document',
    $id: 'doc:docs/plans/v0/missing.md',
    $path: 'docs/plans/v0/missing.md',
    id: 'doc:docs/plans/v0/missing.md',
    path: 'docs/plans/v0/missing.md',
    title: 'missing.md',
  });
  expect(graph.nodes['doc:docs/decisions/docs/plans/v0/missing.md']).toBe(
    undefined,
  );
});
