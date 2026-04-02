/**
 * @import { GraphNode } from './build-graph.types.ts';
 */

/**
 * @typedef {GraphNode &
 *   Record<string, unknown> & {
 *     $class?: string,
 *     $path?: string,
 *     id?: string,
 *     kind?: string,
 *     path?: string,
 *   }} GraphNodeLike
 */

/**
 * @param {GraphNode | undefined} graph_node
 * @returns {string}
 */
export function getGraphNodeId(graph_node) {
  if (!graph_node) {
    throw new Error('Expected a graph node.');
  }

  const legacy_graph_node = /** @type {GraphNodeLike} */ (graph_node);

  return graph_node.identity?.id ?? legacy_graph_node.id ?? '';
}

/**
 * @param {GraphNode | undefined} graph_node
 * @returns {string | undefined}
 */
export function getGraphNodeClassName(graph_node) {
  if (!graph_node) {
    return undefined;
  }

  const legacy_graph_node = /** @type {GraphNodeLike} */ (graph_node);

  return (
    graph_node.identity?.class_name ??
    legacy_graph_node.$class ??
    legacy_graph_node.kind
  );
}

/**
 * @param {GraphNode | undefined} graph_node
 * @returns {string | undefined}
 */
export function getGraphNodePath(graph_node) {
  if (!graph_node) {
    return undefined;
  }

  const legacy_graph_node = /** @type {GraphNodeLike} */ (graph_node);

  return (
    graph_node.identity?.path ??
    legacy_graph_node.$path ??
    legacy_graph_node.path
  );
}

/**
 * @param {GraphNode | undefined} graph_node
 * @param {string} field_name
 * @returns {GraphNode['metadata'][string] | undefined}
 */
export function getGraphNodeMetadataValue(graph_node, field_name) {
  if (!graph_node) {
    return undefined;
  }

  if (graph_node.metadata) {
    return graph_node.metadata[field_name];
  }

  return /** @type {GraphNode['metadata'][string] | undefined} */ (
    /** @type {GraphNodeLike} */ (graph_node)[field_name]
  );
}
