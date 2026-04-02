/* eslint-disable max-lines-per-function */
/**
 * @import { PatramClaim } from '../parse/parse-claims.types.ts';
 * @import { PatramConfig } from '../config/patram-config.types.ts';
 */

import { expect, it } from 'vitest';

import { parseSourceFile } from '../parse/parse-claims.js';
import { buildGraph } from './build-graph.js';

it('promotes document-backed classes through class identity and separates identity from metadata', () => {
  const graph = buildGraph(
    createDocumentPathIdentityConfig(),
    parseClaims({
      path: 'docs/decisions/query-language.md',
      source: ['# Query Language', '', '- Status: accepted'].join('\n'),
    }),
  );

  expect(graph.document_path_ids).toEqual({
    'docs/decisions/query-language.md': 'decision:query-language',
  });
  expect(graph.nodes['decision:query-language']).toEqual({
    identity: {
      class_name: 'decision',
      id: 'decision:query-language',
      path: 'docs/decisions/query-language.md',
    },
    key: 'query-language',
    metadata: {
      status: 'accepted',
      title: 'Query Language',
    },
  });
  expect(graph.nodes['doc:docs/decisions/query-language.md']).toBe(
    graph.nodes['decision:query-language'],
  );
});

/**
 * @returns {PatramConfig}
 */
function createDocumentPathIdentityConfig() {
  return {
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
        label: 'Document',
      },
    },
    fields: {
      status: {
        type: 'enum',
        values: ['accepted'],
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
          class: 'document',
          field: 'status',
        },
      },
    },
    path_classes: {
      decision_docs: {
        prefixes: ['docs/decisions/'],
      },
    },
    relations: {},
  };
}

/**
 * @param {import('../parse/parse-claims.types.ts').ParseClaimsInput} parse_input
 * @returns {PatramClaim[]}
 */
function parseClaims(parse_input) {
  return parseSourceFile(parse_input).claims;
}
