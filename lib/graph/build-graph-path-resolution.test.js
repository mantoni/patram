/**
 * @import { ParseClaimsInput, PatramClaim } from '../parse/parse-claims.types.ts';
 * @import { PatramConfig } from '../config/patram-config.types.ts';
 */
import { expect, it } from 'vitest';

import { buildGraph } from './build-graph.js';
import { parseSourceFile } from '../parse/parse-claims.js';

/** @type {PatramConfig} */
const WORKTRACKING_RELATION_CONFIG = {
  classes: {
    decision: {
      identity: {
        type: 'document_path',
      },
      label: 'Decision',
      schema: {
        document_path_class: 'decision_docs',
        fields: {
          status: {
            presence: 'optional',
          },
        },
        unknown_fields: 'ignore',
      },
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
    'markdown.directive.status': {
      node: {
        class: 'decision',
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
  path_classes: {
    decision_docs: {
      prefixes: ['docs/decisions/'],
    },
  },
  relations: {
    tracked_in: {
      from: ['decision'],
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
        '- Status: accepted',
        '- Tracked in: docs/plans/v0/missing.md',
      ].join('\n'),
    }),
  ]);

  expect(graph.edges).toContainEqual({
    from: 'decision:query-language',
    id: 'edge:1',
    origin: {
      column: 1,
      line: 4,
      path: 'docs/decisions/query-language.md',
    },
    relation: 'tracked_in',
    to: 'doc:docs/plans/v0/missing.md',
  });
  expect(graph.nodes['doc:docs/plans/v0/missing.md']).toEqual({
    identity: {
      class_name: 'document',
      id: 'doc:docs/plans/v0/missing.md',
      path: 'docs/plans/v0/missing.md',
    },
    key: 'docs/plans/v0/missing.md',
    metadata: {
      title: 'missing.md',
    },
  });
  expect(graph.nodes['doc:docs/decisions/docs/plans/v0/missing.md']).toBe(
    undefined,
  );
});

/**
 * @param {ParseClaimsInput} parse_input
 * @param {{ multi_value_directive_names?: ReadonlySet<string> }} [parse_options]
 * @returns {PatramClaim[]}
 */
function parseClaims(parse_input, parse_options) {
  return parseSourceFile(parse_input, parse_options).claims;
}
