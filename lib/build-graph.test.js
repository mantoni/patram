/** @import * as $k$$l$patram$j$config$k$types$k$ts from './patram-config.types.ts'; */
/**
 * @import { PatramClaim } from './parse-claims.types.ts';
 */

import { expect, it } from 'vitest';

import graph_v0_config from '../docs/graph-v0.config.json' with { type: 'json' };
import { buildGraph } from './build-graph.js';
import { parseClaims } from './parse-claims.js';
import { parsePatramConfig } from './patram-config.js';

const patram_config = parsePatramConfig(graph_v0_config);

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
        id: 'doc:docs/orphan.md',
        kind: 'document',
        path: 'docs/orphan.md',
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
 */
function createSemanticCommandConfig() {
  return parsePatramConfig({
    kinds: createSemanticCommandKinds(),
    mappings: {
      'document.title': createDocumentTitleMapping(),
      'markdown.directive.command': createCommandDefinitionMapping(),
      'markdown.directive.command_summary': {
        node: {
          field: 'summary',
          kind: 'command',
        },
      },
    },
    relations: {
      defines: {
        from: ['document'],
        to: ['command'],
      },
    },
  });
}

/**
 * @returns {PatramClaim[]}
 */
function createSemanticCommandClaims() {
  return parseClaims({
    path: 'docs/reference/commands/query.md',
    source: [
      '# Query',
      '',
      'Command: query',
      'Command Summary: Run a stored query.',
    ].join('\n'),
  });
}

/**
 * @param {import('./build-graph.types.ts').BuildGraphResult} graph
 */
function expectSemanticCommandGraph(graph) {
  expect(graph.edges).toContainEqual({
    from: 'doc:docs/reference/commands/query.md',
    id: 'edge:1',
    origin: {
      column: 1,
      line: 3,
      path: 'docs/reference/commands/query.md',
    },
    relation: 'defines',
    to: 'command:query',
  });
  expect(graph.nodes['command:query']).toEqual({
    id: 'command:query',
    key: 'query',
    kind: 'command',
    path: 'docs/reference/commands/query.md',
    summary: 'Run a stored query.',
    title: 'query',
  });
}

/**
 * Create config for one path-resolved semantic command relation.
 */
function createSemanticCommandRelationConfig() {
  return parsePatramConfig({
    kinds: createSemanticCommandKinds(),
    mappings: {
      'document.title': createDocumentTitleMapping(),
      'jsdoc.directive.implements_command': {
        emit: {
          relation: 'implements_command',
          target: 'path',
          target_kind: 'command',
        },
      },
      'markdown.directive.command': createCommandDefinitionMapping(),
    },
    relations: {
      defines: {
        from: ['document'],
        to: ['command'],
      },
      implements_command: {
        from: ['document'],
        to: ['command'],
      },
    },
  });
}

/**
 * @returns {PatramClaim[]}
 */
function createSemanticCommandRelationClaims() {
  return [
    ...parseClaims({
      path: 'docs/reference/commands/query.md',
      source: ['# Query', '', 'Command: query'].join('\n'),
    }),
    ...parseClaims({
      path: 'lib/patram-cli.js',
      source: [
        '/**',
        ' * Patram command execution flow.',
        ' * Implements Command: ../docs/reference/commands/query.md',
        ' * @patram',
        ' */',
        'export function runCommand() {}',
      ].join('\n'),
    }),
  ];
}

/**
 * Create config for repo-style worktracking directives.
 */
function createWorktrackingRelationConfig() {
  return parsePatramConfig({
    kinds: {
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
          target_kind: 'document',
        },
      },
    },
    relations: {
      tracked_in: {
        from: ['document'],
        to: ['document'],
      },
    },
  });
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
    from: 'doc:lib/patram-cli.js',
    id: 'edge:2',
    origin: {
      column: 4,
      line: 3,
      path: 'lib/patram-cli.js',
    },
    relation: 'implements_command',
    to: 'command:query',
  };
}

function createSemanticCommandKinds() {
  return {
    command: {
      label: 'Command',
    },
    document: {
      builtin: true,
    },
  };
}

function createDocumentTitleMapping() {
  return {
    node: {
      field: 'title',
      kind: 'document',
    },
  };
}

function createCommandDefinitionMapping() {
  return {
    emit: {
      relation: 'defines',
      target: 'value',
      target_kind: 'command',
    },
    node: {
      field: 'title',
      key: 'value',
      kind: 'command',
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
      id: 'doc:docs/graph-v0.md',
      kind: 'document',
      path: 'docs/graph-v0.md',
    },
    'doc:docs/patram.md': {
      id: 'doc:docs/patram.md',
      kind: 'document',
      path: 'docs/patram.md',
      title: 'Patram',
    },
    'term:docs/terms/patram.md': {
      id: 'term:docs/terms/patram.md',
      key: 'docs/terms/patram.md',
      kind: 'term',
      path: 'docs/terms/patram.md',
    },
  };
}
