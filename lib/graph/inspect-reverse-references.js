/**
 * @import { BuildGraphResult, GraphNode } from './build-graph.types.ts';
 * @import { PatramDiagnostic, PatramRepoConfig } from './load-patram-config.types.ts';
 */

import {
  normalizeRepoRelativePath,
  resolveDocumentNodeId,
} from './document-node-identity.js';
import { queryGraph } from './query/execute.js';

/**
 * Inspect incoming graph edges for one canonical target file.
 *
 * @param {BuildGraphResult} graph
 * @param {string} target_file_path
 * @param {PatramRepoConfig | undefined} repo_config
 * @param {string | undefined} where_clause
 * @returns {{
 *   diagnostics: PatramDiagnostic[],
 *   incoming: Record<string, GraphNode[]>,
 *   node: GraphNode,
 * }}
 */
export function inspectReverseReferences(
  graph,
  target_file_path,
  repo_config,
  where_clause,
) {
  const normalized_target_path = normalizeRepoRelativePath(target_file_path);
  const target_node_id = resolveDocumentNodeId(
    graph.document_node_ids,
    normalized_target_path,
  );
  const target_node =
    graph.nodes[target_node_id] ??
    createFallbackTargetNode(target_node_id, normalized_target_path);
  const allowed_source_node_ids = where_clause
    ? resolveAllowedSourceNodeIds(graph, where_clause, repo_config)
    : null;

  if (allowed_source_node_ids && 'diagnostics' in allowed_source_node_ids) {
    return {
      diagnostics: allowed_source_node_ids.diagnostics,
      incoming: {},
      node: target_node,
    };
  }

  return {
    diagnostics: [],
    incoming: collectIncomingGroups(
      graph,
      target_node.id,
      allowed_source_node_ids,
    ),
    node: target_node,
  };
}

/**
 * @param {BuildGraphResult} graph
 * @param {string} target_node_id
 * @param {Set<string> | null} allowed_source_node_ids
 * @returns {Record<string, GraphNode[]>}
 */
function collectIncomingGroups(graph, target_node_id, allowed_source_node_ids) {
  /** @type {Map<string, Map<string, GraphNode>>} */
  const grouped_incoming = new Map();

  for (const graph_edge of graph.edges) {
    if (graph_edge.to !== target_node_id) {
      continue;
    }

    if (
      allowed_source_node_ids &&
      !allowed_source_node_ids.has(graph_edge.from)
    ) {
      continue;
    }

    const source_node = graph.nodes[graph_edge.from];

    if (!source_node) {
      continue;
    }

    let relation_sources = grouped_incoming.get(graph_edge.relation);

    if (!relation_sources) {
      relation_sources = new Map();
      grouped_incoming.set(graph_edge.relation, relation_sources);
    }

    relation_sources.set(source_node.id, source_node);
  }

  return formatIncomingGroups(grouped_incoming);
}

/**
 * @param {BuildGraphResult} graph
 * @param {string} where_clause
 * @param {PatramRepoConfig | undefined} repo_config
 * @returns {{ diagnostics: PatramDiagnostic[] } | Set<string>}
 */
function resolveAllowedSourceNodeIds(graph, where_clause, repo_config) {
  const query_result = queryGraph(
    graph,
    where_clause,
    repo_config ?? {
      fields: {},
      include: [],
      queries: {},
    },
  );

  if (query_result.diagnostics.length > 0) {
    return {
      diagnostics: query_result.diagnostics,
    };
  }

  return new Set(query_result.nodes.map((graph_node) => graph_node.id));
}

/**
 * @param {Map<string, Map<string, GraphNode>>} grouped_incoming
 * @returns {Record<string, GraphNode[]>}
 */
function formatIncomingGroups(grouped_incoming) {
  /** @type {Record<string, GraphNode[]>} */
  const incoming = {};

  for (const relation_name of [...grouped_incoming.keys()].sort(
    compareStrings,
  )) {
    const relation_sources = /** @type {Map<string, GraphNode>} */ (
      grouped_incoming.get(relation_name)
    );

    incoming[relation_name] = [...relation_sources.values()].sort(
      compareGraphNodes,
    );
  }

  return incoming;
}

/**
 * @param {string} node_id
 * @param {string} target_path
 * @returns {GraphNode}
 */
function createFallbackTargetNode(node_id, target_path) {
  return {
    $class: 'document',
    $id: node_id,
    $path: target_path,
    id: node_id,
    path: target_path,
    title: target_path,
  };
}

/**
 * @param {GraphNode} left_node
 * @param {GraphNode} right_node
 * @returns {number}
 */
function compareGraphNodes(left_node, right_node) {
  return compareStrings(left_node.id, right_node.id);
}

/**
 * @param {string} left_value
 * @param {string} right_value
 * @returns {number}
 */
function compareStrings(left_value, right_value) {
  return left_value.localeCompare(right_value, 'en');
}
