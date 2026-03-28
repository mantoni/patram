/**
 * @import { BuildGraphResult, GraphNode } from './build-graph.types.ts';
 * @import { PatramRepoConfig } from './load-patram-config.types.ts';
 */

import { expect, it } from 'vitest';

import { overlayGraph } from './overlay-graph.js';
import { queryGraph } from './query-graph.js';

/** @type {PatramRepoConfig} */
const QUERY_REPO_CONFIG = {
  fields: {},
  include: [],
  queries: {},
  relations: {
    assigned_to: {
      from: ['document'],
      to: ['worker'],
    },
  },
};

it('composes overlay nodes and edges into a queryable graph', () => {
  const graph = overlayGraph(create_base_graph(), {
    edges: [
      {
        from: 'doc:index.md',
        id: 'edge:assigned_to',
        origin: {
          column: 1,
          line: 1,
          path: 'runtime/local',
        },
        relation: 'assigned_to',
        to: 'worker:alpha',
      },
    ],
    nodes: [
      {
        $class: 'worker',
        $id: 'worker:alpha',
        id: 'worker:alpha',
        title: 'Worker Alpha',
      },
    ],
  });

  const query_result = queryGraph(
    graph,
    'assigned_to=worker:alpha',
    QUERY_REPO_CONFIG,
  );

  expect(query_result.diagnostics).toEqual([]);
  expect(query_result.nodes.map((graph_node) => graph_node.id)).toEqual([
    'doc:index.md',
  ]);
});

it('merges overlay fields onto matching nodes without mutating the base graph', () => {
  const base_graph = create_base_graph();
  const graph = overlayGraph(base_graph, {
    nodes: {
      'doc:index.md': {
        id: 'doc:index.md',
        runtime_status: 'active',
        title: 'Overlay Title',
      },
    },
  });

  expect(graph.nodes['doc:index.md']).toEqual({
    $class: 'document',
    $id: 'doc:index.md',
    $path: 'index.md',
    id: 'doc:index.md',
    path: 'index.md',
    runtime_status: 'active',
    title: 'Overlay Title',
  });
  expect(base_graph.nodes['doc:index.md']).toEqual({
    $class: 'document',
    $id: 'doc:index.md',
    $path: 'index.md',
    id: 'doc:index.md',
    path: 'index.md',
    title: 'Index',
  });
});

it('preserves and extends document path aliases for semantic document nodes', () => {
  const graph = overlayGraph(create_semantic_base_graph(), {
    nodes: [
      create_semantic_document_node(
        'task:overlay',
        'task',
        'docs/tasks/overlay.md',
      ),
    ],
  });

  expect(graph.document_node_ids).toEqual({
    'docs/decisions/query.md': 'decision:query',
    'docs/tasks/overlay.md': 'task:overlay',
  });
  expect(graph.nodes['doc:docs/decisions/query.md']).toBe(
    graph.nodes['decision:query'],
  );
  expect(graph.nodes['doc:docs/tasks/overlay.md']).toBe(
    graph.nodes['task:overlay'],
  );
});

/**
 * @returns {BuildGraphResult}
 */
function create_base_graph() {
  return {
    edges: [],
    nodes: {
      'doc:index.md': {
        $class: 'document',
        $id: 'doc:index.md',
        $path: 'index.md',
        id: 'doc:index.md',
        path: 'index.md',
        title: 'Index',
      },
    },
  };
}

/**
 * @returns {BuildGraphResult}
 */
function create_semantic_base_graph() {
  /** @type {BuildGraphResult} */
  const graph = {
    document_node_ids: {
      'docs/decisions/query.md': 'decision:query',
    },
    edges: [],
    nodes: {
      'decision:query': create_semantic_document_node(
        'decision:query',
        'decision',
        'docs/decisions/query.md',
      ),
    },
  };

  Object.defineProperty(graph.nodes, 'doc:docs/decisions/query.md', {
    configurable: false,
    enumerable: false,
    value: graph.nodes['decision:query'],
    writable: false,
  });

  return graph;
}

/**
 * @param {string} node_id
 * @param {string} class_name
 * @param {string} path
 * @returns {GraphNode}
 */
function create_semantic_document_node(node_id, class_name, path) {
  return {
    $class: class_name,
    $id: node_id,
    $path: path,
    id: node_id,
    path,
    title: node_id,
  };
}
