/**
 * @import { GraphNode } from './build-graph.types.ts';
 */

export {
  collectDocumentEntityKeys,
  collectDocumentNodeReferences,
  normalizeRepoRelativePath,
  resolveDocumentNodeId,
  resolveTargetReference,
} from './document-node-identity.js';

/**
 * Attach one canonical path to a graph node.
 *
 * @param {GraphNode} graph_node
 * @param {string | undefined} source_path
 */
export function setCanonicalPath(graph_node, source_path) {
  if (!source_path) {
    return;
  }

  if (!graph_node.identity.path) {
    graph_node.identity.path = source_path;
    return;
  }

  if (graph_node.identity.path !== source_path) {
    throw new Error(
      `Node "${graph_node.identity.id}" maps to multiple canonical paths.`,
    );
  }
}
