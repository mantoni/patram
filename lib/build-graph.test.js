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

it('keeps canonical paths on custom nodes so they stay queryable', () => {
  const graph = buildGraph(
    parsePatramConfig({
      kinds: {
        command: {
          label: 'Command',
        },
        document: {
          builtin: true,
        },
      },
      mappings: {
        'document.title': {
          node: {
            field: 'title',
            kind: 'document',
          },
        },
        'markdown.directive.command': {
          node: {
            field: 'title',
            kind: 'command',
          },
        },
      },
      relations: {},
    }),
    parseClaims({
      path: 'docs/reference/commands/query.md',
      source: ['# Query', '', 'Command: query'].join('\n'),
    }),
  );

  expect(graph.nodes['command:docs/reference/commands/query.md']).toEqual({
    id: 'command:docs/reference/commands/query.md',
    key: 'docs/reference/commands/query.md',
    kind: 'command',
    path: 'docs/reference/commands/query.md',
    title: 'query',
  });
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
 * Create the expected graph for the materialization test.
 *
 * @returns {object}
 */
function createExpectedGraph() {
  return {
    edges: createExpectedEdges(),
    nodes: createExpectedNodes(),
  };
}

/**
 * Create the expected edges for the materialization test.
 *
 * @returns {object[]}
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
 *
 * @returns {object}
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
