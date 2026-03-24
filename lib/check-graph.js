/**
 * @import { BuildGraphResult, GraphEdge, GraphNode } from './build-graph.types.ts';
 * @import { PatramDiagnostic, PatramRepoConfig } from './load-patram-config.types.ts';
 * @import { PatramClaim } from './parse-claims.types.ts';
 */

import { checkDirectiveMetadata } from './check-directive-metadata.js';

/**
 * Graph validation.
 *
 * Reports broken document links and missing edge nodes after graph
 * materialization.
 *
 * Kind: graph
 * Status: active
 * Tracked in: ../docs/plans/v0/source-anchor-dogfooding.md
 * Decided by: ../docs/decisions/check-link-target-existence.md
 * Implements: ../docs/tasks/v0/check-command.md
 * @patram
 * @see {@link ./build-graph.js}
 * @see {@link ../docs/decisions/check-link-target-existence.md}
 */

/**
 * Check a materialized graph for broken document links and missing edge nodes.
 *
 * @param {BuildGraphResult} graph
 * @param {string[]} existing_file_paths
 * @param {PatramRepoConfig} [repo_config]
 * @param {PatramClaim[]} [claims]
 * @returns {PatramDiagnostic[]}
 */
export function checkGraph(graph, existing_file_paths, repo_config, claims) {
  /** @type {PatramDiagnostic[]} */
  const diagnostics = [];
  const existing_file_path_set = new Set(existing_file_paths);

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
      existing_file_path_set,
    );
  }

  if (repo_config && claims) {
    diagnostics.push(
      ...checkDirectiveMetadata(
        graph,
        repo_config,
        claims,
        existing_file_paths,
      ),
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
 * @param {Set<string>} existing_file_path_set
 */
function collectBrokenLinkDiagnostics(
  diagnostics,
  graph_edge,
  target_node,
  existing_file_path_set,
) {
  if (graph_edge.relation !== 'links_to') {
    return;
  }

  if (target_node.kind !== 'document' || !target_node.path) {
    return;
  }

  if (existing_file_path_set.has(target_node.path)) {
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
