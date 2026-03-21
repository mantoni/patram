/**
 * @import { BuildGraphResult, GraphNode } from './build-graph.types.ts';
 * @import { PatramDiagnostic } from './load-patram-config.types.ts';
 */

import { parseWhereClause } from './parse-where-clause.js';

export const DEFAULT_QUERY_LIMIT = 25;

/**
 * Filter graph nodes with the v0 query language.
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

  const predicates = parse_result.clauses.map(createPredicate);
  const relation_index = createRelationIndex(graph.edges);
  const graph_nodes = Object.values(graph.nodes).sort(compareGraphNodes);
  const matching_nodes = graph_nodes.filter((graph_node) =>
    predicates.every((predicate) => predicate(graph_node, relation_index)),
  );
  const paginated_nodes = paginateNodes(matching_nodes, pagination_options);

  return {
    diagnostics: [],
    nodes: paginated_nodes,
    total_count: matching_nodes.length,
  };
}

/**
 * @param {{ is_negated: boolean, term: { kind: 'field', field_name: 'kind' | 'path' | 'status' | 'title', operator: '=' | '^=' | '~', value: string } | { kind: 'relation', relation_name: string } }} clause
 * @returns {(graph_node: GraphNode, relation_index: Map<string, Set<string>>) => boolean}
 */
function createPredicate(clause) {
  if (clause.term.kind === 'relation') {
    return createRelationPredicate(
      clause.term.relation_name,
      clause.is_negated,
    );
  }

  return createFieldPredicateFromTerm(clause.term, clause.is_negated);
}

/**
 * @param {string} relation_name
 * @param {boolean} is_negated
 * @returns {(graph_node: GraphNode, relation_index: Map<string, Set<string>>) => boolean}
 */
function createRelationPredicate(relation_name, is_negated) {
  return (graph_node, relation_index) => {
    const relation_names = relation_index.get(graph_node.id);
    const is_match = relation_names?.has(relation_name) ?? false;

    return is_negated ? !is_match : is_match;
  };
}

/**
 * @param {BuildGraphResult['edges']} graph_edges
 * @returns {Map<string, Set<string>>}
 */
function createRelationIndex(graph_edges) {
  /** @type {Map<string, Set<string>>} */
  const relation_index = new Map();

  for (const graph_edge of graph_edges) {
    let relation_names = relation_index.get(graph_edge.from);

    if (!relation_names) {
      relation_names = new Set();
      relation_index.set(graph_edge.from, relation_names);
    }

    relation_names.add(graph_edge.relation);
  }

  return relation_index;
}

/**
 * @param {string} field_name
 * @param {string} expected_value
 * @param {boolean} is_negated
 * @returns {(graph_node: GraphNode) => boolean}
 */
function createFieldPredicate(field_name, expected_value, is_negated) {
  return (graph_node) => {
    const actual_value = graph_node[field_name];
    const is_match = actual_value === expected_value;

    return is_negated ? !is_match : is_match;
  };
}

/**
 * @param {string} path_prefix
 * @param {boolean} is_negated
 * @returns {(graph_node: GraphNode) => boolean}
 */
function createPathPrefixPredicate(path_prefix, is_negated) {
  return (graph_node) => {
    const path_value = graph_node.path ?? '';
    const is_match = path_value.startsWith(path_prefix);

    return is_negated ? !is_match : is_match;
  };
}

/**
 * @param {string} title_text
 * @param {boolean} is_negated
 * @returns {(graph_node: GraphNode) => boolean}
 */
function createTitlePredicate(title_text, is_negated) {
  const normalized_title_text = title_text.toLocaleLowerCase('en');

  return (graph_node) => {
    const title_value = graph_node.title ?? '';
    const is_match = title_value
      .toLocaleLowerCase('en')
      .includes(normalized_title_text);

    return is_negated ? !is_match : is_match;
  };
}

/**
 * @param {{ field_name: 'kind' | 'path' | 'status' | 'title', kind: 'field', operator: '=' | '^=' | '~', value: string }} term
 * @param {boolean} is_negated
 * @returns {(graph_node: GraphNode, relation_index: Map<string, Set<string>>) => boolean}
 */
function createFieldPredicateFromTerm(term, is_negated) {
  const term_key = `${term.field_name}${term.operator}`;

  if (term_key === 'kind=' || term_key === 'status=' || term_key === 'path=') {
    return createFieldPredicate(term.field_name, term.value, is_negated);
  }

  if (term_key === 'path^=') {
    return createPathPrefixPredicate(term.value, is_negated);
  }

  if (term_key === 'title~') {
    return createTitlePredicate(term.value, is_negated);
  }

  throw new Error('Unsupported parsed where clause.');
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
