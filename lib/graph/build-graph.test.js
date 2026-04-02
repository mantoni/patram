/* eslint-disable max-lines, @typescript-eslint/no-unsafe-assignment */
/**
 * @import { BuildGraphResult } from './build-graph.types.ts';
 * @import { PatramClaim } from '../parse/parse-claims.types.ts';
 * @import { MappingDefinition, PatramConfig } from '../config/patram-config.types.ts';
 */

import { expect, it } from 'vitest';

import { buildGraph } from './build-graph.js';
import { parseSourceFile } from '../parse/parse-claims.js';

const patram_config = createGraphConfigFixture();

it('builds document nodes, configured target nodes and edges from claims', () => {
  const graph = buildGraph(patram_config, createMarkdownClaims());

  expect(graph).toEqual(createExpectedGraph());
});

it('keeps source document nodes even when a claim has no mapping', () => {
  const graph = buildGraph(patram_config, [
    {
      document_id: 'doc:docs/orphan.md',
      id: 'claim:doc:docs/orphan.md:1',
      origin: {
        column: 1,
        line: 2,
        path: 'docs/orphan.md',
      },
      type: 'directive',
      value: 'ignored',
    },
  ]);

  expect(graph).toEqual({
    edges: [],
    nodes: {
      'doc:docs/orphan.md': {
        identity: {
          class_name: 'document',
          id: 'doc:docs/orphan.md',
          path: 'docs/orphan.md',
        },
        key: 'docs/orphan.md',
        metadata: {
          title: 'orphan.md',
        },
      },
    },
  });
});

it('materializes semantic command ids while keeping canonical paths queryable', () => {
  const graph = buildGraph(
    createSemanticCommandConfig(),
    createSemanticCommandClaims(),
  );

  expectSemanticCommandGraph(graph);
});

it('resolves path-based taxonomy relations through canonical semantic ids', () => {
  const graph = buildGraph(
    createSemanticCommandRelationConfig(),
    createSemanticCommandRelationClaims(),
  );

  expect(graph.edges).toContainEqual(
    createExpectedSemanticCommandRelationEdge(),
  );
});

it('keeps repo-relative directive targets when the target document exists', () => {
  const graph = buildGraph(
    createWorktrackingRelationConfig(),
    createWorktrackingRelationClaims(),
  );

  expect(graph.edges).toContainEqual({
    from: 'doc:docs/decisions/query-language.md',
    id: 'edge:1',
    origin: {
      column: 1,
      line: 5,
      path: 'docs/decisions/query-language.md',
    },
    relation: 'tracked_in',
    to: 'doc:docs/plans/v0/query-language.md',
  });
  expect(
    graph.nodes['doc:docs/decisions/docs/plans/v0/query-language.md'],
  ).toBe(undefined);
});

it('validates mapped fields against configured graph schemas', () => {
  expect(() =>
    buildGraph(createUnknownFieldConfig(), [
      createDirectiveClaim('docs/topic.md', 'summary', 'Hello'),
    ]),
  ).toThrow('Node class "document" maps to unknown field "summary".');

  expect(() =>
    buildGraph(createForbiddenFieldConfig(), [
      createDirectiveClaim('docs/tasks/alpha.md', 'status', 'blocked'),
    ]),
  ).toThrow('Field "status" is forbidden for class "task".');

  expect(() =>
    buildGraph(createUndeclaredFieldConfig(), [
      createDirectiveClaim('docs/tasks/alpha.md', 'owner', 'max'),
    ]),
  ).toThrow('Field "owner" is not declared for class "task".');
});

it('throws when mapped node fields require string claim values', () => {
  expect(() =>
    buildGraph(createScalarFieldConfig(), [
      createDirectiveClaim('docs/topic.md', 'summary', {
        target: 'docs/x.md',
        text: 'x',
      }),
    ]),
  ).toThrow(
    'Claim "claim:docs/topic.md:summary:2" does not carry a string value.',
  );
});

it('promotes document classes and accumulates sorted multi-value fields', () => {
  const graph = buildGraph(createPromotedDocumentConfig(), [
    createDirectiveClaim('docs/tasks/alpha.md', 'tag', 'zeta', 3),
    createDirectiveClaim('docs/tasks/alpha.md', 'tag', 'alpha', 4),
    createDirectiveClaim('docs/tasks/alpha.md', 'tag', 'alpha', 5),
  ]);

  expect(graph.nodes['doc:docs/tasks/alpha.md']).toBe(
    graph.nodes['tag_set:alpha'],
  );
  expect(graph.nodes['tag_set:alpha']).toEqual(
    expect.objectContaining({
      identity: {
        class_name: 'tag_set',
        id: 'tag_set:alpha',
        path: 'docs/tasks/alpha.md',
      },
      key: 'alpha',
      metadata: {
        tags: ['alpha', 'zeta'],
        title: 'alpha.md',
      },
    }),
  );
});

it('rejects conflicting title and scalar field assignments', () => {
  expect(() =>
    buildGraph(createConflictingTitleConfig(), [
      createDirectiveClaim('docs/topic.md', 'label', 'Alpha'),
      createDirectiveClaim('docs/topic.md', 'label', 'Beta', 3),
    ]),
  ).toThrow(
    'Node "topic:docs/topic.md" has conflicting title values "Alpha" and "Beta".',
  );

  expect(() =>
    buildGraph(createScalarFieldConfig(), [
      createDirectiveClaim('docs/topic.md', 'summary', 'Alpha'),
      createDirectiveClaim('docs/topic.md', 'summary', 'Beta', 3),
    ]),
  ).toThrow(
    'Node "topic:docs/topic.md" has conflicting values for field "summary": "Alpha" and "Beta".',
  );
});

it('prefers explicit title mappings over derived document titles', () => {
  const graph = buildGraph(createExplicitTitleOverrideConfig(), [
    createDocumentTitleClaim('docs/topic.md', 'Topic'),
    createDirectiveClaim('docs/topic.md', 'label', 'Explicit Topic', 3),
  ]);

  expect(graph.nodes['doc:docs/topic.md']).toEqual(
    expect.objectContaining({
      metadata: {
        title: 'Explicit Topic',
      },
    }),
  );
});

it('inherits backing document descriptions onto promoted semantic nodes', () => {
  const graph = buildGraph(
    createSemanticTermDescriptionConfig(),
    parseClaims({
      path: 'docs/reference/terms/document.md',
      source: [
        '# Document',
        '',
        '- Term: document',
        '',
        'The built-in file-backed graph node kind keyed by normalized relative path.',
      ].join('\n'),
    }),
  );

  expect(graph.nodes['doc:docs/reference/terms/document.md']).toEqual(
    expect.objectContaining({
      metadata: expect.objectContaining({
        description:
          'The built-in file-backed graph node kind keyed by normalized relative path.',
      }),
    }),
  );
  expect(graph.nodes['term:document']).toEqual(
    expect.objectContaining({
      metadata: expect.objectContaining({
        description:
          'The built-in file-backed graph node kind keyed by normalized relative path.',
      }),
    }),
  );
});

it('prefers explicit semantic descriptions over inherited markdown descriptions', () => {
  const graph = buildGraph(
    createSemanticTermDescriptionConfig(),
    parseClaims({
      path: 'docs/reference/terms/document.md',
      source: [
        '# Document',
        '',
        '- Term: document',
        '- Description: Explicit semantic description.',
        '',
        'The built-in file-backed graph node kind keyed by normalized relative path.',
      ].join('\n'),
    }),
  );

  expect(graph.nodes['doc:docs/reference/terms/document.md']).toEqual(
    expect.objectContaining({
      metadata: expect.objectContaining({
        description: 'Explicit semantic description.',
      }),
    }),
  );
  expect(graph.nodes['term:document']).toEqual(
    expect.objectContaining({
      metadata: expect.objectContaining({
        description: 'Explicit semantic description.',
      }),
    }),
  );
});

/**
 * Create markdown claims for graph materialization tests.
 *
 * @returns {PatramClaim[]}
 */
function createMarkdownClaims() {
  return parseClaims({
    path: 'docs/patram.md',
    source: createMarkdownSource(),
  });
}

/**
 * Create markdown input for graph materialization tests.
 *
 * @returns {string}
 */
function createMarkdownSource() {
  return [
    '# Patram',
    '',
    'Read the [graph design](./graph-v0.md).',
    'Defined by: terms/patram.md',
  ].join('\n');
}

/**
 * Create config for one canonical semantic command document.
 *
 * @returns {PatramConfig}
 */
function createSemanticCommandConfig() {
  return {
    classes: createSemanticCommandClasses(),
    fields: {
      summary: {
        type: 'string',
      },
    },
    mappings: {
      'document.title': createDocumentTitleMapping(),
      'markdown.directive.command_summary': {
        node: {
          field: 'summary',
          class: 'command',
        },
      },
    },
    relations: {
      defines: {
        from: ['command'],
        to: ['command'],
      },
    },
    path_classes: {
      command_docs: {
        prefixes: ['docs/reference/commands/'],
      },
    },
  };
}

/**
 * @returns {PatramConfig}
 */
function createSemanticTermDescriptionConfig() {
  return {
    classes: createSemanticTermDescriptionClasses(),
    fields: {
      description: {
        type: 'string',
      },
    },
    mappings: createSemanticTermDescriptionMappings(),
    path_classes: {
      term_docs: {
        prefixes: ['docs/reference/terms/'],
      },
    },
    relations: createSemanticTermDescriptionRelations(),
  };
}

/**
 * @returns {PatramConfig['classes']}
 */
function createSemanticTermDescriptionClasses() {
  return {
    document: {
      builtin: true,
    },
    term: {
      identity: {
        type: 'document_path',
      },
      label: 'Term',
      schema: {
        fields: {},
        document_path_class: 'term_docs',
      },
    },
  };
}

/**
 * @returns {PatramConfig['mappings']}
 */
function createSemanticTermDescriptionMappings() {
  return {
    'document.title': createDocumentTitleMapping(),
    'document.description': {
      node: {
        field: 'description',
        class: 'document',
      },
    },
    'markdown.directive.description': {
      node: {
        field: 'description',
        class: 'term',
      },
    },
  };
}

/**
 * @returns {PatramConfig['relations']}
 */
function createSemanticTermDescriptionRelations() {
  return {
    defines: {
      from: ['term'],
      to: ['term'],
    },
  };
}

/**
 * @returns {PatramClaim[]}
 */
function createSemanticCommandClaims() {
  return parseClaims({
    path: 'docs/reference/commands/query.md',
    source: ['# Query', '', 'Command Summary: Run a stored query.'].join('\n'),
  });
}

/**
 * @param {BuildGraphResult} graph
 */
function expectSemanticCommandGraph(graph) {
  expect(graph.document_path_ids).toEqual({
    'docs/reference/commands/query.md': 'command:query',
  });
  expect(graph.nodes['command:query']).toEqual({
    identity: {
      class_name: 'command',
      id: 'command:query',
      path: 'docs/reference/commands/query.md',
    },
    key: 'query',
    metadata: {
      summary: 'Run a stored query.',
      title: 'Query',
    },
  });
}

/**
 * Create config for one path-resolved semantic command relation.
 *
 * @returns {PatramConfig}
 */
function createSemanticCommandRelationConfig() {
  return {
    classes: createSemanticCommandClasses(),
    fields: {
      summary: {
        type: 'string',
      },
    },
    mappings: {
      'document.title': createDocumentTitleMapping(),
      'jsdoc.directive.implements_command': {
        emit: {
          relation: 'implements_command',
          target: 'path',
          target_class: 'command',
        },
      },
    },
    relations: {
      defines: {
        from: ['command'],
        to: ['command'],
      },
      implements_command: {
        from: ['document'],
        to: ['command'],
      },
    },
    path_classes: {
      command_docs: {
        prefixes: ['docs/reference/commands/'],
      },
    },
  };
}

/**
 * @returns {PatramClaim[]}
 */
function createSemanticCommandRelationClaims() {
  return [
    ...parseClaims({
      path: 'docs/reference/commands/query.md',
      source: '# Query',
    }),
    ...parseClaims({
      path: 'lib/cli/main.js',
      source: [
        '/**',
        ' * Patram command execution flow.',
        ' * Implements Command: ../../docs/reference/commands/query.md',
        ' * @patram',
        ' */',
        'export function runCommand() {}',
      ].join('\n'),
    }),
  ];
}

/**
 * Create config for repo-style worktracking directives.
 *
 * @returns {PatramConfig}
 */
function createWorktrackingRelationConfig() {
  return {
    classes: {
      document: {
        builtin: true,
      },
    },
    mappings: {
      'document.title': createDocumentTitleMapping(),
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
}

/**
 * @returns {PatramClaim[]}
 */
function createWorktrackingRelationClaims() {
  return [
    ...parseClaims({
      path: 'docs/plans/v0/query-language.md',
      source: '# Query Language Plan\n',
    }),
    ...parseClaims({
      path: 'docs/decisions/query-language.md',
      source: [
        '# Query Language Decision',
        '',
        '- Kind: decision',
        '- Status: accepted',
        '- Tracked in: docs/plans/v0/query-language.md',
      ].join('\n'),
    }),
  ];
}

function createExpectedSemanticCommandRelationEdge() {
  return {
    from: 'doc:lib/cli/main.js',
    id: 'edge:1',
    origin: {
      column: 4,
      line: 3,
      path: 'lib/cli/main.js',
    },
    relation: 'implements_command',
    to: 'command:query',
  };
}

/**
 * @returns {PatramConfig['classes']}
 */
function createSemanticCommandClasses() {
  return {
    command: {
      identity: {
        type: 'document_path',
      },
      label: 'Command',
      schema: {
        fields: {},
        document_path_class: 'command_docs',
      },
    },
    document: {
      builtin: true,
    },
  };
}

/**
 * @returns {MappingDefinition}
 */
function createDocumentTitleMapping() {
  return {
    node: {
      field: 'title',
      class: 'document',
    },
  };
}

/**
 * Create the expected graph for the materialization test.
 */
function createExpectedGraph() {
  return {
    edges: createExpectedEdges(),
    nodes: createExpectedNodes(),
  };
}

/**
 * Create the expected edges for the materialization test.
 */
function createExpectedEdges() {
  return [
    {
      from: 'doc:docs/patram.md',
      id: 'edge:1',
      origin: {
        column: 10,
        line: 3,
        path: 'docs/patram.md',
      },
      relation: 'links_to',
      to: 'doc:docs/graph-v0.md',
    },
    {
      from: 'doc:docs/patram.md',
      id: 'edge:2',
      origin: {
        column: 1,
        line: 4,
        path: 'docs/patram.md',
      },
      relation: 'defines',
      to: 'term:docs/terms/patram.md',
    },
  ];
}

/**
 * Create the expected nodes for the materialization test.
 */
function createExpectedNodes() {
  return {
    'doc:docs/graph-v0.md': {
      identity: {
        class_name: 'document',
        id: 'doc:docs/graph-v0.md',
        path: 'docs/graph-v0.md',
      },
      key: 'docs/graph-v0.md',
      metadata: {
        title: 'graph-v0.md',
      },
    },
    'doc:docs/patram.md': {
      identity: {
        class_name: 'document',
        id: 'doc:docs/patram.md',
        path: 'docs/patram.md',
      },
      key: 'docs/patram.md',
      metadata: {
        title: 'Patram',
      },
    },
    'term:docs/terms/patram.md': {
      identity: {
        class_name: 'term',
        id: 'term:docs/terms/patram.md',
        path: 'docs/terms/patram.md',
      },
      key: 'docs/terms/patram.md',
      metadata: {
        title: 'patram.md',
      },
    },
  };
}

/**
 * Create config for the graph materialization fixture.
 *
 * @returns {PatramConfig}
 */
function createGraphConfigFixture() {
  return {
    classes: createGraphConfigClasses(),
    mappings: createGraphConfigMappings(),
    path_classes: createGraphConfigPathClasses(),
    relations: createGraphConfigRelations(),
  };
}

/**
 * @returns {PatramConfig['classes']}
 */
function createGraphConfigClasses() {
  return {
    document: {
      builtin: true,
      label: 'Document',
    },
    term: {
      identity: {
        type: 'document_path',
      },
      label: 'Term',
      schema: {
        fields: {},
        document_path_class: 'term_docs',
      },
    },
  };
}

/**
 * @returns {PatramConfig['path_classes']}
 */
function createGraphConfigPathClasses() {
  return {
    command_docs: {
      prefixes: ['docs/reference/commands/'],
    },
    term_docs: {
      prefixes: ['docs/terms/'],
    },
  };
}

/**
 * @returns {PatramConfig['mappings']}
 */
function createGraphConfigMappings() {
  return {
    'document.title': createDocumentTitleMapping(),
    'html.link': {
      emit: {
        relation: 'links_to',
        target: 'path',
        target_class: 'document',
      },
    },
    'jsdoc.link': {
      emit: {
        relation: 'links_to',
        target: 'path',
        target_class: 'document',
      },
    },
    'markdown.directive.defined_by': {
      emit: {
        relation: 'defines',
        target: 'path',
        target_class: 'term',
      },
    },
    'markdown.link': {
      emit: {
        relation: 'links_to',
        target: 'path',
        target_class: 'document',
      },
    },
  };
}

/**
 * @returns {PatramConfig['relations']}
 */
function createGraphConfigRelations() {
  return {
    defines: {
      from: ['document'],
      to: ['term'],
    },
    links_to: {
      builtin: true,
      from: ['document'],
      to: ['document'],
    },
    mentions: {
      from: ['document'],
      to: ['term'],
    },
  };
}

/**
 * @param {string} origin_path
 * @param {string} name
 * @param {string | { target: string, text: string }} value
 * @param {number} line
 * @returns {PatramClaim}
 */
function createDirectiveClaim(origin_path, name, value, line = 2) {
  return {
    document_id: `doc:${origin_path}`,
    id: `claim:${origin_path}:${name}:${line}`,
    name,
    origin: {
      column: 1,
      line,
      path: origin_path,
    },
    parser: 'markdown',
    type: 'directive',
    value,
  };
}

/**
 * @param {string} origin_path
 * @param {string} value
 * @param {number} line
 * @returns {PatramClaim}
 */
function createDocumentTitleClaim(origin_path, value, line = 1) {
  return {
    document_id: `doc:${origin_path}`,
    id: `claim:${origin_path}:document.title:${line}`,
    origin: {
      column: 1,
      line,
      path: origin_path,
    },
    type: 'document.title',
    value,
  };
}

/**
 * @returns {PatramConfig}
 */
function createUnknownFieldConfig() {
  return {
    classes: {
      document: {
        builtin: true,
      },
    },
    mappings: {
      'markdown.directive.summary': {
        node: {
          field: 'summary',
          class: 'document',
        },
      },
    },
    relations: {},
  };
}

/**
 * @returns {PatramConfig}
 */
function createForbiddenFieldConfig() {
  return {
    classes: {
      document: {
        builtin: true,
      },
      task: {
        schema: {
          fields: {
            status: {
              presence: 'forbidden',
            },
          },
          unknown_fields: 'ignore',
        },
      },
    },
    fields: {
      status: {
        type: 'string',
      },
    },
    mappings: {
      'markdown.directive.status': {
        node: {
          field: 'status',
          class: 'task',
        },
      },
    },
    relations: {},
  };
}

/**
 * @returns {PatramConfig}
 */
function createUndeclaredFieldConfig() {
  return {
    classes: {
      document: {
        builtin: true,
      },
      task: {
        schema: {
          fields: {},
          unknown_fields: 'error',
        },
      },
    },
    fields: {
      owner: {
        type: 'string',
      },
    },
    mappings: {
      'markdown.directive.owner': {
        node: {
          field: 'owner',
          class: 'task',
        },
      },
    },
    relations: {},
  };
}

/**
 * @returns {PatramConfig}
 */
function createScalarFieldConfig() {
  return {
    classes: {
      document: {
        builtin: true,
      },
      topic: {
        label: 'Topic',
      },
    },
    fields: {
      summary: {
        type: 'string',
      },
    },
    mappings: {
      'markdown.directive.summary': {
        node: {
          field: 'summary',
          class: 'topic',
        },
      },
    },
    relations: {},
  };
}

/**
 * @returns {PatramConfig}
 */
function createPromotedDocumentConfig() {
  return {
    classes: {
      document: {
        builtin: true,
      },
      tag_set: {
        identity: {
          type: 'document_path',
        },
        label: 'Tag Set',
        schema: {
          document_path_class: 'task_docs',
          fields: {
            tags: {
              presence: 'optional',
            },
          },
          unknown_fields: 'ignore',
        },
      },
    },
    fields: {
      tags: {
        multiple: true,
        type: 'string',
      },
    },
    mappings: {
      'markdown.directive.tag': {
        node: {
          field: 'tags',
          class: 'tag_set',
        },
      },
    },
    path_classes: {
      task_docs: {
        prefixes: ['docs/tasks/'],
      },
    },
    relations: {},
  };
}

/**
 * @returns {PatramConfig}
 */
function createConflictingTitleConfig() {
  return {
    classes: {
      document: {
        builtin: true,
      },
      topic: {
        label: 'Topic',
      },
    },
    mappings: {
      'markdown.directive.label': {
        node: {
          field: 'title',
          class: 'topic',
        },
      },
    },
    relations: {},
  };
}

/**
 * @returns {PatramConfig}
 */
function createExplicitTitleOverrideConfig() {
  return {
    classes: {
      document: {
        builtin: true,
      },
    },
    mappings: {
      'document.title': createDocumentTitleMapping(),
      'markdown.directive.label': {
        node: {
          field: 'title',
          class: 'document',
        },
      },
    },
    relations: {},
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
