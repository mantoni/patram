/* eslint-disable max-lines */
/**
 * @import { BuildGraphResult, GraphNode } from './build-graph.types.ts';
 * @import { PatramDiagnostic } from './load-patram-config.types.ts';
 * @import {
 *   ParsedAggregateTerm,
 *   ParsedClause,
 *   ParsedFieldSetTerm,
 *   ParsedFieldTerm,
 *   ParsedRelationTargetTerm,
 *   ParsedTerm,
 *   ParsedTraversalTerm,
 * } from './parse-where-clause.types.ts';
 */

import { parseWhereClause } from './parse-where-clause.js';

/**
 * Query graph filtering.
 *
 * Applies the v0 where-clause language to graph nodes and keeps pagination
 * separate from matching.
 *
 * Kind: graph
 * Status: active
 * Uses Term: ../docs/reference/terms/graph.md
 * Uses Term: ../docs/reference/terms/query.md
 * Tracked in: ../docs/plans/v0/source-anchor-dogfooding.md
 * Decided by: ../docs/decisions/query-language.md
 * Implements: ../docs/tasks/v0/query-command.md
 * @patram
 * @see {@link ./load-project-graph.js}
 * @see {@link ../docs/decisions/query-language.md}
 */

export const DEFAULT_QUERY_LIMIT = 25;

/**
 * @typedef {{
 *   incoming: Map<string, Map<string, Set<string>>>,
 *   outgoing: Map<string, Map<string, Set<string>>>,
 * }} RelationIndexes
 */

/**
 * @typedef {{
 *   nodes: BuildGraphResult['nodes'],
 *   relation_indexes: RelationIndexes,
 * }} EvaluationContext
 */

/**
 * Filter graph nodes with the query language.
 *
 * @param {BuildGraphResult} graph
 * @param {string} where_clause
 * @param {{ limit?: number, offset?: number }=} pagination_options
 * @returns {{ diagnostics: PatramDiagnostic[], nodes: GraphNode[], total_count: number }}
 */
export function queryGraph(graph, where_clause, pagination_options = {}) {
  const parse_result = parseWhereClause(where_clause);

  if (!parse_result.success) {
    return {
      diagnostics: [parse_result.diagnostic],
      nodes: [],
      total_count: 0,
    };
  }

  const evaluation_context = {
    nodes: graph.nodes,
    relation_indexes: createRelationIndexes(graph.edges),
  };
  const graph_nodes = Object.values(graph.nodes).sort(compareGraphNodes);
  const matching_nodes = graph_nodes.filter((graph_node) =>
    matchesClauses(graph_node, parse_result.clauses, evaluation_context),
  );
  const paginated_nodes = paginateNodes(matching_nodes, pagination_options);

  return {
    diagnostics: [],
    nodes: paginated_nodes,
    total_count: matching_nodes.length,
  };
}

/**
 * @param {GraphNode} graph_node
 * @param {ParsedClause[]} clauses
 * @param {EvaluationContext} evaluation_context
 * @returns {boolean}
 */
function matchesClauses(graph_node, clauses, evaluation_context) {
  return clauses.every((clause) =>
    matchesClause(graph_node, clause, evaluation_context),
  );
}

/**
 * @param {GraphNode} graph_node
 * @param {ParsedClause} clause
 * @param {EvaluationContext} evaluation_context
 * @returns {boolean}
 */
function matchesClause(graph_node, clause, evaluation_context) {
  const is_match = matchesTerm(graph_node, clause.term, evaluation_context);

  return clause.is_negated ? !is_match : is_match;
}

/**
 * @param {GraphNode} graph_node
 * @param {ParsedTerm} term
 * @param {EvaluationContext} evaluation_context
 * @returns {boolean}
 */
function matchesTerm(graph_node, term, evaluation_context) {
  if (term.kind === 'aggregate') {
    return matchesAggregateTerm(graph_node, term, evaluation_context);
  }

  if (term.kind === 'field') {
    return matchesFieldTerm(graph_node, term);
  }

  if (term.kind === 'field_set') {
    return matchesFieldSetTerm(graph_node, term);
  }

  if (term.kind === 'relation') {
    return hasOutgoingRelation(
      graph_node.id,
      term.relation_name,
      evaluation_context.relation_indexes,
    );
  }

  return matchesRelationTargetTerm(graph_node, term, evaluation_context);
}

/**
 * @param {GraphNode} graph_node
 * @param {ParsedAggregateTerm} term
 * @param {EvaluationContext} evaluation_context
 * @returns {boolean}
 */
function matchesAggregateTerm(graph_node, term, evaluation_context) {
  const related_nodes = getRelatedNodes(
    graph_node.id,
    term.traversal,
    evaluation_context,
  );
  const matching_count = related_nodes.filter((related_node) =>
    matchesClauses(related_node, term.clauses, evaluation_context),
  ).length;

  if (term.aggregate_name === 'any') {
    return matching_count > 0;
  }

  if (term.aggregate_name === 'none') {
    return matching_count === 0;
  }

  return compareNumbers(
    matching_count,
    term.comparison ?? '=',
    term.value ?? 0,
  );
}

/**
 * @param {GraphNode} graph_node
 * @param {ParsedFieldTerm} term
 * @returns {boolean}
 */
function matchesFieldTerm(graph_node, term) {
  const term_key = `${term.field_name}${term.operator}`;

  if (
    term_key === 'id=' ||
    term_key === 'kind=' ||
    term_key === 'path=' ||
    term_key === 'status='
  ) {
    return graph_node[term.field_name] === term.value;
  }

  if (term_key === 'id^=') {
    return graph_node.id.startsWith(term.value);
  }

  if (term_key === 'path^=') {
    return (graph_node.path ?? '').startsWith(term.value);
  }

  if (term_key === 'title~') {
    return (graph_node.title ?? '')
      .toLocaleLowerCase('en')
      .includes(term.value.toLocaleLowerCase('en'));
  }

  throw new Error('Unsupported parsed where clause.');
}

/**
 * @param {GraphNode} graph_node
 * @param {ParsedFieldSetTerm} term
 * @returns {boolean}
 */
function matchesFieldSetTerm(graph_node, term) {
  const actual_value = graph_node[term.field_name];
  const is_member = actual_value ? term.values.includes(actual_value) : false;

  return term.operator === 'in' ? is_member : !is_member;
}

/**
 * @param {GraphNode} graph_node
 * @param {ParsedRelationTargetTerm} term
 * @param {EvaluationContext} evaluation_context
 * @returns {boolean}
 */
function matchesRelationTargetTerm(graph_node, term, evaluation_context) {
  const relation_targets = evaluation_context.relation_indexes.outgoing.get(
    graph_node.id,
  );
  const matching_targets = relation_targets?.get(term.relation_name);

  return matching_targets?.has(term.target_id) ?? false;
}

/**
 * @param {string} node_id
 * @param {string} relation_name
 * @param {RelationIndexes} relation_indexes
 * @returns {boolean}
 */
function hasOutgoingRelation(node_id, relation_name, relation_indexes) {
  const relation_targets = relation_indexes.outgoing.get(node_id);

  return relation_targets?.has(relation_name) ?? false;
}

/**
 * @param {string} node_id
 * @param {ParsedTraversalTerm} traversal
 * @param {EvaluationContext} evaluation_context
 * @returns {GraphNode[]}
 */
function getRelatedNodes(node_id, traversal, evaluation_context) {
  const relation_index =
    traversal.direction === 'in'
      ? evaluation_context.relation_indexes.incoming
      : evaluation_context.relation_indexes.outgoing;
  const relation_targets = relation_index.get(node_id);
  const target_ids = relation_targets?.get(traversal.relation_name);

  if (!target_ids) {
    return [];
  }

  return [...target_ids].flatMap((target_id) => {
    const target_node = evaluation_context.nodes[target_id];

    return target_node ? [target_node] : [];
  });
}

/**
 * @param {number} left_value
 * @param {'!=' | '<' | '<=' | '=' | '>' | '>='} comparison
 * @param {number} right_value
 * @returns {boolean}
 */
function compareNumbers(left_value, comparison, right_value) {
  if (comparison === '!=') {
    return left_value !== right_value;
  }

  if (comparison === '<') {
    return left_value < right_value;
  }

  if (comparison === '<=') {
    return left_value <= right_value;
  }

  if (comparison === '=') {
    return left_value === right_value;
  }

  if (comparison === '>') {
    return left_value > right_value;
  }

  if (comparison === '>=') {
    return left_value >= right_value;
  }

  throw new Error('Unsupported aggregate comparison.');
}

/**
 * @param {BuildGraphResult['edges']} graph_edges
 * @returns {RelationIndexes}
 */
function createRelationIndexes(graph_edges) {
  return {
    incoming: createDirectionalRelationIndex(graph_edges, 'to', 'from'),
    outgoing: createDirectionalRelationIndex(graph_edges, 'from', 'to'),
  };
}

/**
 * @param {BuildGraphResult['edges']} graph_edges
 * @param {'from' | 'to'} source_key
 * @param {'from' | 'to'} target_key
 * @returns {Map<string, Map<string, Set<string>>>}
 */
function createDirectionalRelationIndex(graph_edges, source_key, target_key) {
  /** @type {Map<string, Map<string, Set<string>>>} */
  const relation_index = new Map();

  for (const graph_edge of graph_edges) {
    const source_id = graph_edge[source_key];
    const target_id = graph_edge[target_key];
    let relation_targets = relation_index.get(source_id);

    if (!relation_targets) {
      relation_targets = new Map();
      relation_index.set(source_id, relation_targets);
    }

    let target_ids = relation_targets.get(graph_edge.relation);

    if (!target_ids) {
      target_ids = new Set();
      relation_targets.set(graph_edge.relation, target_ids);
    }

    target_ids.add(target_id);
  }

  return relation_index;
}

/**
 * @param {GraphNode} left_node
 * @param {GraphNode} right_node
 * @returns {number}
 */
function compareGraphNodes(left_node, right_node) {
  return left_node.id.localeCompare(right_node.id, 'en');
}

/**
 * @param {GraphNode[]} matching_nodes
 * @param {{ limit?: number, offset?: number }} pagination_options
 * @returns {GraphNode[]}
 */
function paginateNodes(matching_nodes, pagination_options) {
  const offset = pagination_options.offset ?? 0;
  const limit = pagination_options.limit ?? matching_nodes.length;

  return matching_nodes.slice(offset, offset + limit);
}
