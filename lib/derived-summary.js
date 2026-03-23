/**
 * @import { BuildGraphResult, GraphNode } from './build-graph.types.ts';
 * @import { OutputDerivedSummary } from './output-view.types.ts';
 * @import { DerivedSummaryConfig, DerivedSummaryFieldConfig, DerivedSummaryScalar, PatramRepoConfig } from './load-patram-config.types.ts';
 */

import { queryGraph } from './query-graph.js';

/**
 * Derived summary evaluation.
 *
 * Evaluates repo-configured output-only metadata for graph nodes without
 * mutating graph state.
 *
 * Kind: output
 * Status: active
 * Tracked in: ../docs/plans/v0/declarative-derived-summaries.md
 * Decided by: ../docs/decisions/declarative-derived-summary-config.md
 * Decided by: ../docs/decisions/declarative-derived-summary-side-effects.md
 * @patram
 * @see {@link ./load-patram-config.js}
 * @see {@link ./render-output-view.js}
 */

/**
 * @typedef {{
 *   evaluate: (graph_node: GraphNode) => OutputDerivedSummary | null,
 * }} DerivedSummaryEvaluator
 */

/**
 * @param {PatramRepoConfig} repo_config
 * @param {BuildGraphResult} graph
 * @returns {DerivedSummaryEvaluator}
 */
export function createDerivedSummaryEvaluator(repo_config, graph) {
  const summary_by_kind = createSummaryByKind(repo_config.derived_summaries);
  /** @type {Map<string, Set<string>>} */
  const matching_node_id_cache = new Map();

  return {
    evaluate(graph_node) {
      const configured_summary = summary_by_kind.get(graph_node.kind);

      if (!configured_summary) {
        return null;
      }

      return {
        fields: configured_summary.definition.fields.map(
          (field_definition) => ({
            name: field_definition.name,
            value: evaluateFieldValue(
              field_definition,
              configured_summary.definition,
              graph,
              graph_node,
              matching_node_id_cache,
            ),
          }),
        ),
        name: configured_summary.name,
      };
    },
  };
}

/**
 * @param {DerivedSummaryFieldConfig} field_definition
 * @param {DerivedSummaryConfig} summary_definition
 * @param {BuildGraphResult} graph
 * @param {GraphNode} graph_node
 * @param {Map<string, Set<string>>} matching_node_id_cache
 * @returns {DerivedSummaryScalar}
 */
function evaluateFieldValue(
  field_definition,
  summary_definition,
  graph,
  graph_node,
  matching_node_id_cache,
) {
  if ('count' in field_definition) {
    return countMatchingTraversalNodes(
      graph,
      graph_node,
      field_definition.count.traversal,
      field_definition.count.where,
      matching_node_id_cache,
    );
  }

  return selectFieldValue(
    graph,
    graph_node,
    summary_definition,
    field_definition,
    matching_node_id_cache,
  );
}

/**
 * @param {BuildGraphResult} graph
 * @param {GraphNode} graph_node
 * @param {string} traversal_text
 * @param {string} where_clause
 * @param {Map<string, Set<string>>} matching_node_id_cache
 * @returns {number}
 */
function countMatchingTraversalNodes(
  graph,
  graph_node,
  traversal_text,
  where_clause,
  matching_node_id_cache,
) {
  const target_node_ids = getTraversedNodeIds(
    graph,
    graph_node.id,
    traversal_text,
  );

  if (target_node_ids.size === 0) {
    return 0;
  }

  const matching_node_ids = getMatchingNodeIds(
    graph,
    where_clause,
    matching_node_id_cache,
  );
  let matching_count = 0;

  for (const target_node_id of target_node_ids) {
    if (matching_node_ids.has(target_node_id)) {
      matching_count += 1;
    }
  }

  return matching_count;
}

/**
 * @param {BuildGraphResult} graph
 * @param {GraphNode} graph_node
 * @param {DerivedSummaryConfig} summary_definition
 * @param {Extract<DerivedSummaryFieldConfig, { select: unknown }>} field_definition
 * @param {Map<string, Set<string>>} matching_node_id_cache
 * @returns {DerivedSummaryScalar}
 */
function selectFieldValue(
  graph,
  graph_node,
  summary_definition,
  field_definition,
  matching_node_id_cache,
) {
  for (const select_case of field_definition.select) {
    const matching_node_ids = getMatchingNodeIds(
      graph,
      select_case.when,
      matching_node_id_cache,
    );

    if (matching_node_ids.has(graph_node.id)) {
      return select_case.value;
    }
  }

  return field_definition.default;
}

/**
 * @param {BuildGraphResult} graph
 * @param {string} where_clause
 * @param {Map<string, Set<string>>} matching_node_id_cache
 * @returns {Set<string>}
 */
function getMatchingNodeIds(graph, where_clause, matching_node_id_cache) {
  const cached_node_ids = matching_node_id_cache.get(where_clause);

  if (cached_node_ids) {
    return cached_node_ids;
  }

  const query_result = queryGraph(graph, where_clause);

  if (query_result.diagnostics.length > 0) {
    throw new Error(
      `Expected derived summary query "${where_clause}" to be valid.`,
    );
  }

  const matching_node_ids = new Set(
    query_result.nodes.map((matching_node) => matching_node.id),
  );

  matching_node_id_cache.set(where_clause, matching_node_ids);

  return matching_node_ids;
}

/**
 * @param {BuildGraphResult} graph
 * @param {string} node_id
 * @param {string} traversal_text
 * @returns {Set<string>}
 */
function getTraversedNodeIds(graph, node_id, traversal_text) {
  const traversal = parseTraversal(traversal_text);
  /** @type {Set<string>} */
  const target_node_ids = new Set();

  for (const graph_edge of graph.edges) {
    if (graph_edge.relation !== traversal.relation_name) {
      continue;
    }

    if (traversal.direction === 'in' && graph_edge.to === node_id) {
      target_node_ids.add(graph_edge.from);
    }

    if (traversal.direction === 'out' && graph_edge.from === node_id) {
      target_node_ids.add(graph_edge.to);
    }
  }

  return target_node_ids;
}

/**
 * @param {string} traversal_text
 * @returns {{ direction: 'in' | 'out', relation_name: string }}
 */
function parseTraversal(traversal_text) {
  const traversal_match =
    /^(?<direction>in|out):(?<relation_name>[a-zA-Z0-9_]+)$/du.exec(
      traversal_text,
    );

  if (
    !traversal_match?.groups?.direction ||
    !traversal_match.groups.relation_name
  ) {
    throw new Error(`Invalid derived summary traversal "${traversal_text}".`);
  }

  return {
    direction: /** @type {'in' | 'out'} */ (traversal_match.groups.direction),
    relation_name: traversal_match.groups.relation_name,
  };
}

/**
 * @param {PatramRepoConfig['derived_summaries']} derived_summaries
 * @returns {Map<string, { definition: DerivedSummaryConfig, name: string }>}
 */
function createSummaryByKind(derived_summaries) {
  /** @type {Map<string, { definition: DerivedSummaryConfig, name: string }>} */
  const summary_by_kind = new Map();

  if (!derived_summaries) {
    return summary_by_kind;
  }

  for (const [summary_name, summary_definition] of Object.entries(
    derived_summaries,
  )) {
    for (const kind_name of summary_definition.kinds) {
      summary_by_kind.set(kind_name, {
        definition: summary_definition,
        name: summary_name,
      });
    }
  }

  return summary_by_kind;
}
