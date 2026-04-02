/**
 * @import { PatramClaim } from '../parse/parse-claims.types.ts';
 * @import { PatramConfig } from '../config/patram-config.types.ts';
 */

import { expect, it } from 'vitest';

import { buildGraph } from './build-graph.js';
import { parseSourceFile } from '../parse/parse-claims.js';

it('keeps document-backed nodes path-backed without semantic identities', () => {
  const graph = buildGraph(
    createPathOnlyDocumentConfig(),
    parseClaims({
      path: 'docs/notes/query-language.md',
      source: ['# Query Language Note', '', '- Status: active'].join('\n'),
    }),
  );

  expect(graph.nodes['doc:docs/notes/query-language.md']).toEqual({
    identity: {
      class_name: 'document',
      id: 'doc:docs/notes/query-language.md',
      path: 'docs/notes/query-language.md',
    },
    key: 'docs/notes/query-language.md',
    metadata: {
      status: 'active',
      title: 'Query Language Note',
    },
  });
});

it('promotes document-backed nodes through document-path identities', () => {
  const graph = buildGraph(
    createDocumentPathIdentityConfig(),
    parseClaims({
      path: 'docs/decisions/query-language.md',
      source: ['# Query Language Decision', '', '- Status: accepted'].join(
        '\n',
      ),
    }),
  );

  expect(graph.nodes['decision:query-language']).toEqual({
    identity: {
      class_name: 'decision',
      id: 'decision:query-language',
      path: 'docs/decisions/query-language.md',
    },
    key: 'query-language',
    metadata: {
      status: 'accepted',
      title: 'Query Language Decision',
    },
  });
  expect(graph.nodes['doc:docs/decisions/query-language.md']).toBe(
    graph.nodes['decision:query-language'],
  );
});

it('promotes document-backed nodes through claim-value identities', () => {
  const graph = buildGraph(
    createClaimValueIdentityConfig(),
    parseClaims({
      path: 'docs/contracts/release-flow.md',
      source: [
        '# Release Flow Contract',
        '',
        '- Contract: release-flow',
        '- Status: active',
      ].join('\n'),
    }),
  );

  expect(graph.nodes['contract:release-flow']).toEqual({
    identity: {
      class_name: 'contract',
      id: 'contract:release-flow',
      path: 'docs/contracts/release-flow.md',
    },
    key: 'release-flow',
    metadata: {
      status: 'active',
      title: 'Release Flow Contract',
    },
  });
  expect(graph.nodes['doc:docs/contracts/release-flow.md']).toBe(
    graph.nodes['contract:release-flow'],
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

it('sorts and deduplicates repeated multi-value metadata fields', () => {
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

  expect(graph.nodes['decision:query-language']).toMatchObject({
    metadata: {
      tags: ['alpha', 'zebra'],
      title: 'Query Language Decision',
    },
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
        type: 'string',
      },
    },
    mappings: {
      'document.title': createDocumentTitleMapping(),
      'markdown.directive.status': {
        node: {
          class: 'decision',
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
 * @returns {PatramConfig}
 */
function createClaimValueIdentityConfig() {
  return {
    classes: {
      contract: {
        identity: {
          claim_types: ['markdown.directive.contract'],
          type: 'claim_value',
        },
        label: 'Contract',
        schema: {
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
        type: 'string',
      },
    },
    mappings: {
      'document.title': createDocumentTitleMapping(),
      'markdown.directive.status': {
        node: {
          class: 'contract',
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
  const class_schema = options.class_schema ?? {
    fields: {},
  };

  return {
    classes: {
      decision: {
        identity: {
          type: 'document_path',
        },
        label: 'Decision',
        schema: {
          ...class_schema,
          fields: class_schema.fields ?? {},
          document_path_class: 'decision_docs',
        },
      },
      document: {
        builtin: true,
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
    path_classes: {
      decision_docs: {
        prefixes: ['docs/decisions/'],
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
        identity: {
          type: 'document_path',
        },
        label: 'Decision',
        schema: {
          document_path_class: 'decision_docs',
          fields: {
            tags: {
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
    path_classes: {
      decision_docs: {
        prefixes: ['docs/decisions/'],
      },
    },
    relations: {},
  };
}

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
 * @returns {PatramClaim[]}
 */
function parseClaims(parse_input) {
  return parseSourceFile(parse_input).claims;
}
