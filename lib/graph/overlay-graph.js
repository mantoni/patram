/**
 * @import { BuildGraphResult, GraphEdge, GraphNode } from './build-graph.types.ts';
 */

/**
 * @typedef {{
 *   document_node_ids?: BuildGraphResult['document_node_ids'],
 *   edges?: GraphEdge[],
 *   nodes?: GraphNode[] | Record<string, GraphNode>,
 * }} GraphOverlay
 */

/**
 * Graph overlay composition.
 *
 * Composes transient nodes and edges onto an existing Patram graph while
 * preserving the graph shape expected by query and document resolution
 * helpers.
 *
 * Kind: graph
 * Status: active
 * Uses Term: ../../docs/reference/terms/document.md
 * Uses Term: ../../docs/reference/terms/graph.md
 * Tracked in: ../../docs/plans/v0/package-graph-overlay-helper.md
 * Decided by: ../../docs/decisions/package-graph-overlay-helper.md
 * @see {@link ../../docs/decisions/package-graph-overlay-helper.md}
 * @patram
 * @see {@link ./query-graph.js}
 */

/**
 * Compose additional nodes and edges onto a loaded Patram graph.
 *
 * @param {BuildGraphResult} base_graph
 * @param {GraphOverlay} [graph_overlay]
 * @returns {BuildGraphResult}
 */
export function overlayGraph(base_graph, graph_overlay = {}) {
  const graph_nodes = cloneGraphNodes(base_graph.nodes);
  const overlay_nodes = normalizeOverlayNodes(graph_overlay.nodes);

  applyOverlayNodes(graph_nodes, overlay_nodes);

  const graph = {
    edges: [...base_graph.edges, ...(graph_overlay.edges ?? [])],
    nodes: graph_nodes,
  };
  const document_node_ids = createDocumentNodeIds(
    base_graph.document_node_ids,
    graph_nodes,
    graph_overlay.document_node_ids,
  );

  attachDocumentNodeAliases(graph.nodes, document_node_ids);
  Object.defineProperty(graph, 'document_node_ids', {
    configurable: false,
    enumerable: false,
    value: document_node_ids,
    writable: false,
  });

  return graph;
}

/**
 * @param {BuildGraphResult['nodes']} base_graph_nodes
 * @returns {BuildGraphResult['nodes']}
 */
function cloneGraphNodes(base_graph_nodes) {
  return Object.fromEntries(
    Object.entries(base_graph_nodes).map(([node_id, graph_node]) => [
      node_id,
      { ...graph_node },
    ]),
  );
}

/**
 * @param {GraphOverlay['nodes']} overlay_nodes
 * @returns {GraphNode[]}
 */
function normalizeOverlayNodes(overlay_nodes) {
  if (!overlay_nodes) {
    return [];
  }

  if (Array.isArray(overlay_nodes)) {
    return overlay_nodes.map((graph_node) =>
      normalizeOverlayNode(undefined, graph_node),
    );
  }

  return Object.entries(overlay_nodes).map(([node_id, graph_node]) =>
    normalizeOverlayNode(node_id, graph_node),
  );
}

/**
 * @param {string | undefined} node_id
 * @param {GraphNode} graph_node
 * @returns {GraphNode}
 */
function normalizeOverlayNode(node_id, graph_node) {
  if (node_id === undefined) {
    if (typeof graph_node.id !== 'string' || graph_node.id.length === 0) {
      throw new Error('Overlay nodes must define an id.');
    }

    return { ...graph_node };
  }

  if (graph_node.id !== undefined && graph_node.id !== node_id) {
    throw new Error(
      `Overlay node "${node_id}" does not match embedded id "${graph_node.id}".`,
    );
  }

  return {
    ...graph_node,
    id: node_id,
  };
}

/**
 * @param {BuildGraphResult['nodes']} graph_nodes
 * @param {GraphNode[]} overlay_nodes
 */
function applyOverlayNodes(graph_nodes, overlay_nodes) {
  for (const overlay_node of overlay_nodes) {
    const existing_node = graph_nodes[overlay_node.id];

    graph_nodes[overlay_node.id] = existing_node
      ? { ...existing_node, ...overlay_node }
      : { ...overlay_node };
  }
}

/**
 * @param {BuildGraphResult['document_node_ids']} base_document_node_ids
 * @param {BuildGraphResult['nodes']} graph_nodes
 * @param {BuildGraphResult['document_node_ids']} overlay_document_node_ids
 * @returns {Record<string, string>}
 */
function createDocumentNodeIds(
  base_document_node_ids,
  graph_nodes,
  overlay_document_node_ids,
) {
  /** @type {Record<string, string>} */
  const document_node_ids = {
    ...(base_document_node_ids ?? {}),
  };

  for (const graph_node of Object.values(graph_nodes)) {
    if (!graph_node.$path) {
      continue;
    }

    document_node_ids[graph_node.$path] = graph_node.id;
  }

  return {
    ...document_node_ids,
    ...(overlay_document_node_ids ?? {}),
  };
}

/**
 * @param {BuildGraphResult['nodes']} graph_nodes
 * @param {Record<string, string>} document_node_ids
 */
function attachDocumentNodeAliases(graph_nodes, document_node_ids) {
  for (const [document_path, node_id] of Object.entries(document_node_ids)) {
    if (`doc:${document_path}` === node_id) {
      continue;
    }

    const graph_node = graph_nodes[node_id];

    if (!graph_node) {
      continue;
    }

    Object.defineProperty(graph_nodes, `doc:${document_path}`, {
      configurable: false,
      enumerable: false,
      value: graph_node,
      writable: false,
    });
  }
}
