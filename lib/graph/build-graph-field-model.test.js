/**
 * @import { PatramClaim } from '../parse/parse-claims.types.ts';
 * @import { PatramConfig } from '../config/patram-config.types.ts';
 */

import { expect, it } from 'vitest';

import { buildGraph } from './build-graph.js';
import { parseSourceFile } from '../parse/parse-claims.js';

it('keeps document-backed nodes path-backed without semantic structural fields', () => {
  const graph = buildGraph(
    createPathOnlyDocumentConfig(),
    parseClaims({
      path: 'docs/notes/query-language.md',
      source: ['# Query Language Note', '', '- Status: active'].join('\n'),
    }),
  );

  expect(graph.nodes['doc:docs/notes/query-language.md']).toEqual({
    $class: 'document',
    $id: 'doc:docs/notes/query-language.md',
    $path: 'docs/notes/query-language.md',
    id: 'doc:docs/notes/query-language.md',
    path: 'docs/notes/query-language.md',
    status: 'active',
    title: 'Query Language Note',
  });
});

it('reclassifies document nodes when mapped structural class claims are present', () => {
  const graph = buildGraph(
    createDocumentClassOverrideConfig(),
    parseClaims({
      path: 'docs/decisions/query-language.md',
      source: ['# Query Language Decision', '', '- Kind: decision'].join('\n'),
    }),
  );

  expect(graph.nodes['decision:docs/decisions/query-language.md']).toEqual({
    $class: 'decision',
    $id: 'decision:docs/decisions/query-language.md',
    $path: 'docs/decisions/query-language.md',
    id: 'decision:docs/decisions/query-language.md',
    key: 'docs/decisions/query-language.md',
    path: 'docs/decisions/query-language.md',
    title: 'Query Language Decision',
  });
  expect(graph.nodes['doc:docs/decisions/query-language.md']).toBe(
    graph.nodes['decision:docs/decisions/query-language.md'],
  );
  expect(Object.keys(graph.nodes)).not.toContain(
    'doc:docs/decisions/query-language.md',
  );
});

it('promotes document nodes to explicit semantic ids when mapped structural id claims are present', () => {
  const graph = buildGraph(
    createDocumentSemanticIdConfig(),
    parseClaims({
      path: 'docs/contracts/release-flow.md',
      source: [
        '# Release Flow Contract',
        '',
        '- Kind: contract',
        '- Id: release-flow',
        '- Status: active',
      ].join('\n'),
    }),
  );

  expect(graph.nodes['contract:release-flow']).toEqual({
    $class: 'contract',
    $id: 'contract:release-flow',
    $path: 'docs/contracts/release-flow.md',
    id: 'contract:release-flow',
    key: 'release-flow',
    path: 'docs/contracts/release-flow.md',
    status: 'active',
    title: 'Release Flow Contract',
  });
  expect(graph.nodes['doc:docs/contracts/release-flow.md']).toBe(
    graph.nodes['contract:release-flow'],
  );
  expect(Object.keys(graph.nodes)).not.toContain(
    'doc:docs/contracts/release-flow.md',
  );
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
 * @returns {PatramConfig}
 */
function createDocumentSemanticIdConfig() {
  return {
    classes: {
      contract: {
        label: 'Contract',
      },
      document: {
        builtin: true,
        label: 'Document',
      },
    },
    fields: {
      status: {
        type: 'string',
      },
    },
    mappings: {
      'document.title': createDocumentTitleMapping(),
      'markdown.directive.id': {
        node: {
          class: 'document',
          field: '$id',
          key: 'value',
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
    },
    relations: {},
  };
}

/**
 * @param {{ class_schema: NonNullable<PatramConfig['classes']>[string]['schema'], fields?: NonNullable<PatramConfig['fields']> }} options
 * @returns {PatramConfig}
 */
function createFieldValidationConfig(options) {
  return {
    classes: {
      decision: {
        label: 'Decision',
        schema: options.class_schema,
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
function createPathOnlyDocumentConfig() {
  return {
    classes: {
      document: {
        builtin: true,
        label: 'Document',
      },
    },
    fields: {
      status: {
        type: 'string',
      },
    },
    mappings: {
      'document.title': createDocumentTitleMapping(),
      'markdown.directive.status': {
        node: {
          class: 'document',
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

/**
 * @param {import('../parse/parse-claims.types.ts').ParseClaimsInput} parse_input
 * @param {{ multi_value_directive_names?: ReadonlySet<string> }} [parse_options]
 * @returns {PatramClaim[]}
 */
function parseClaims(parse_input, parse_options) {
  return parseSourceFile(parse_input, parse_options).claims;
}
