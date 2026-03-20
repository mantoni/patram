/**
 * @import { BuildGraphResult, GraphEdge, GraphNode } from './build-graph.types.ts';
 * @import { PatramDiagnostic } from './load-patram-config.types.ts';
 */

/**
 * Check a materialized graph for broken document links and missing edge nodes.
 *
 * @param {BuildGraphResult} graph
 * @param {string[]} source_file_paths
 * @returns {PatramDiagnostic[]}
 */
export function checkGraph(graph, source_file_paths) {
  /** @type {PatramDiagnostic[]} */
  const diagnostics = [];
  const source_file_path_set = new Set(source_file_paths);

  for (const graph_edge of graph.edges) {
    const source_node = graph.nodes[graph_edge.from];
    const target_node = graph.nodes[graph_edge.to];

    collectMissingNodeDiagnostics(
      diagnostics,
      graph_edge,
      source_node,
      target_node,
    );

    if (!target_node) {
      continue;
    }

    collectBrokenLinkDiagnostics(
      diagnostics,
      graph_edge,
      target_node,
      source_file_path_set,
    );
  }

  return diagnostics;
}

/**
 * @param {PatramDiagnostic[]} diagnostics
 * @param {GraphEdge} graph_edge
 * @param {GraphNode | undefined} source_node
 * @param {GraphNode | undefined} target_node
 */
function collectMissingNodeDiagnostics(
  diagnostics,
  graph_edge,
  source_node,
  target_node,
) {
  if (!source_node) {
    diagnostics.push(
      createDiagnostic(
        graph_edge,
        'graph.edge_missing_from',
        `Graph edge "${graph_edge.id}" references missing source node "${graph_edge.from}".`,
      ),
    );
  }

  if (!target_node) {
    diagnostics.push(
      createDiagnostic(
        graph_edge,
        'graph.edge_missing_to',
        `Graph edge "${graph_edge.id}" references missing target node "${graph_edge.to}".`,
      ),
    );
  }
}

/**
 * @param {PatramDiagnostic[]} diagnostics
 * @param {GraphEdge} graph_edge
 * @param {GraphNode} target_node
 * @param {Set<string>} source_file_path_set
 */
function collectBrokenLinkDiagnostics(
  diagnostics,
  graph_edge,
  target_node,
  source_file_path_set,
) {
  if (graph_edge.relation !== 'links_to') {
    return;
  }

  if (target_node.kind !== 'document' || !target_node.path) {
    return;
  }

  if (source_file_path_set.has(target_node.path)) {
    return;
  }

  diagnostics.push(
    createDiagnostic(
      graph_edge,
      'graph.link_broken',
      `Document link target "${target_node.path}" was not found.`,
    ),
  );
}

/**
 * @param {GraphEdge} graph_edge
 * @param {string} code
 * @param {string} message
 * @returns {PatramDiagnostic}
 */
function createDiagnostic(graph_edge, code, message) {
  return {
    code,
    column: graph_edge.origin.column,
    level: 'error',
    line: graph_edge.origin.line,
    message,
    path: graph_edge.origin.path,
  };
}
