/**
 * @import { BuildGraphResult } from './build-graph.types.ts';
 */

import { expect, it } from 'vitest';

import { checkGraph } from './check-graph.js';

it('reports broken document links', () => {
  const diagnostics = checkGraph(createGraphWithBrokenLink(), [
    'docs/patram.md',
  ]);

  expect(diagnostics).toEqual([
    {
      code: 'graph.link_broken',
      column: 10,
      level: 'error',
      line: 3,
      message: 'Document link target "docs/missing.md" was not found.',
      path: 'docs/patram.md',
    },
  ]);
});

it('reports graph edges that reference missing nodes', () => {
  const diagnostics = checkGraph(createGraphWithMissingTargetNode(), [
    'docs/patram.md',
  ]);

  expect(diagnostics).toEqual([
    {
      code: 'graph.edge_missing_to',
      column: 8,
      level: 'error',
      line: 6,
      message:
        'Graph edge "edge:1" references missing target node "doc:docs/missing.md".',
      path: 'docs/patram.md',
    },
  ]);
});

it('reports graph edges that reference a missing source node', () => {
  const diagnostics = checkGraph(createGraphWithMissingSourceNode(), [
    'docs/patram.md',
    'docs/decision.md',
  ]);

  expect(diagnostics).toEqual([
    {
      code: 'graph.edge_missing_from',
      column: 6,
      level: 'error',
      line: 2,
      message:
        'Graph edge "edge:1" references missing source node "doc:docs/missing.md".',
      path: 'docs/patram.md',
    },
  ]);
});

it('does not report broken links when the target document exists', () => {
  const diagnostics = checkGraph(createGraphWithBrokenLink(), [
    'docs/missing.md',
    'docs/patram.md',
  ]);

  expect(diagnostics).toEqual([]);
});

it('ignores links_to edges that do not target documents', () => {
  const diagnostics = checkGraph(createGraphWithNonDocumentLinkTarget(), [
    'docs/patram.md',
  ]);

  expect(diagnostics).toEqual([]);
});

/**
 * @returns {BuildGraphResult}
 */
function createGraphWithBrokenLink() {
  return {
    edges: [
      {
        from: 'doc:docs/patram.md',
        id: 'edge:1',
        origin: {
          column: 10,
          line: 3,
          path: 'docs/patram.md',
        },
        relation: 'links_to',
        to: 'doc:docs/missing.md',
      },
    ],
    nodes: {
      'doc:docs/missing.md': {
        id: 'doc:docs/missing.md',
        kind: 'document',
        path: 'docs/missing.md',
      },
      'doc:docs/patram.md': {
        id: 'doc:docs/patram.md',
        kind: 'document',
        path: 'docs/patram.md',
        title: 'Patram',
      },
    },
  };
}

/**
 * @returns {BuildGraphResult}
 */
function createGraphWithMissingTargetNode() {
  return {
    edges: [
      {
        from: 'doc:docs/patram.md',
        id: 'edge:1',
        origin: {
          column: 8,
          line: 6,
          path: 'docs/patram.md',
        },
        relation: 'links_to',
        to: 'doc:docs/missing.md',
      },
    ],
    nodes: {
      'doc:docs/patram.md': {
        id: 'doc:docs/patram.md',
        kind: 'document',
        path: 'docs/patram.md',
      },
    },
  };
}

/**
 * @returns {BuildGraphResult}
 */
function createGraphWithMissingSourceNode() {
  return {
    edges: [
      {
        from: 'doc:docs/missing.md',
        id: 'edge:1',
        origin: {
          column: 6,
          line: 2,
          path: 'docs/patram.md',
        },
        relation: 'links_to',
        to: 'doc:docs/decision.md',
      },
    ],
    nodes: {
      'doc:docs/decision.md': {
        id: 'doc:docs/decision.md',
        kind: 'document',
        path: 'docs/decision.md',
      },
    },
  };
}

/**
 * @returns {BuildGraphResult}
 */
function createGraphWithNonDocumentLinkTarget() {
  return {
    edges: [
      {
        from: 'doc:docs/patram.md',
        id: 'edge:1',
        origin: {
          column: 12,
          line: 4,
          path: 'docs/patram.md',
        },
        relation: 'links_to',
        to: 'decision:query-language',
      },
    ],
    nodes: {
      'decision:query-language': {
        id: 'decision:query-language',
        kind: 'decision',
        title: 'Query Language',
      },
      'doc:docs/patram.md': {
        id: 'doc:docs/patram.md',
        kind: 'document',
        path: 'docs/patram.md',
      },
    },
  };
}
