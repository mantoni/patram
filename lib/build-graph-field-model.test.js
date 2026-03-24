/**
 * @import { PatramClaim } from './parse-claims.types.ts';
 * @import { PatramConfig } from './patram-config.types.ts';
 */

import { expect, it } from 'vitest';

import { buildGraph } from './build-graph.js';
import { parseClaims } from './parse-claims.js';

it('reclassifies document nodes when mapped structural class claims are present', () => {
  const graph = buildGraph(
    createDocumentClassOverrideConfig(),
    parseClaims({
      path: 'docs/decisions/query-language.md',
      source: ['# Query Language Decision', '', '- Kind: decision'].join('\n'),
    }),
  );

  expect(graph.nodes['doc:docs/decisions/query-language.md']).toEqual({
    $class: 'decision',
    $id: 'doc:docs/decisions/query-language.md',
    $path: 'docs/decisions/query-language.md',
    id: 'doc:docs/decisions/query-language.md',
    path: 'docs/decisions/query-language.md',
    title: 'Query Language Decision',
  });
});

it('rejects node mappings that target unknown fields', () => {
  expect(() =>
    buildGraph(
      createFieldValidationConfig({
        class_schema: {
          fields: {},
          unknown_fields: 'ignore',
        },
      }),
      createStatusClaims(),
    ),
  ).toThrow('Node class "decision" maps to unknown field "status".');
});

it('rejects node mappings that target forbidden class fields', () => {
  expect(() =>
    buildGraph(
      createFieldValidationConfig({
        class_schema: {
          fields: {
            status: {
              presence: 'forbidden',
            },
          },
          unknown_fields: 'error',
        },
        fields: {
          status: {
            type: 'enum',
            values: ['accepted'],
          },
        },
      }),
      createStatusClaims(),
    ),
  ).toThrow('Field "status" is forbidden for class "decision".');
});

it('rejects node mappings that use undeclared class fields when unknown fields error', () => {
  expect(() =>
    buildGraph(
      createFieldValidationConfig({
        class_schema: {
          fields: {},
          unknown_fields: 'error',
        },
        fields: {
          status: {
            type: 'enum',
            values: ['accepted'],
          },
        },
      }),
      createStatusClaims(),
    ),
  ).toThrow('Field "status" is not declared for class "decision".');
});

it('sorts and deduplicates repeated multi-value node fields', () => {
  const graph = buildGraph(
    createMultiValueFieldConfig(),
    parseClaims({
      path: 'docs/decisions/query-language.md',
      source: [
        '# Query Language Decision',
        '',
        '- Tags: zebra',
        '- Tags: alpha',
        '- Tags: zebra',
      ].join('\n'),
    }),
  );

  expect(
    graph.nodes['decision:docs/decisions/query-language.md'],
  ).toMatchObject({
    tags: ['alpha', 'zebra'],
  });
});

/**
 * @returns {PatramClaim[]}
 */
function createStatusClaims() {
  return parseClaims({
    path: 'docs/decisions/query-language.md',
    source: ['# Query Language Decision', '', '- Status: accepted'].join('\n'),
  });
}

/**
 * @returns {PatramConfig}
 */
function createDocumentClassOverrideConfig() {
  return {
    classes: {
      decision: {
        label: 'Decision',
      },
      document: {
        builtin: true,
        label: 'Document',
      },
    },
    mappings: {
      'document.title': createDocumentTitleMapping(),
      'markdown.directive.kind': {
        node: {
          class: 'document',
          field: '$class',
        },
      },
    },
    relations: {},
  };
}

/**
 * @param {{ class_schema: NonNullable<PatramConfig['class_schemas']>[string], fields?: NonNullable<PatramConfig['fields']> }} options
 * @returns {PatramConfig}
 */
function createFieldValidationConfig(options) {
  return {
    class_schemas: {
      decision: options.class_schema,
    },
    classes: {
      decision: {
        label: 'Decision',
      },
      document: {
        builtin: true,
        label: 'Document',
      },
    },
    fields: options.fields,
    mappings: {
      'document.title': createDocumentTitleMapping(),
      'markdown.directive.status': {
        node: {
          class: 'decision',
          field: 'status',
        },
      },
    },
    relations: {},
  };
}

/**
 * @returns {PatramConfig}
 */
function createMultiValueFieldConfig() {
  return {
    classes: {
      decision: {
        label: 'Decision',
      },
      document: {
        builtin: true,
        label: 'Document',
      },
    },
    fields: {
      tags: {
        multiple: true,
        type: 'string',
      },
    },
    mappings: {
      'document.title': createDocumentTitleMapping(),
      'markdown.directive.tags': {
        node: {
          class: 'decision',
          field: 'tags',
        },
      },
    },
    relations: {},
  };
}

/**
 * @returns {PatramConfig['mappings']['document.title']}
 */
function createDocumentTitleMapping() {
  return {
    node: {
      class: 'document',
      field: 'title',
    },
  };
}
