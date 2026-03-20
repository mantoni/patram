/**
 * @import { BuildGraphResult, GraphNode } from './build-graph.types.ts';
 * @import { PatramDiagnostic } from './load-patram-config.types.ts';
 */

/**
 * Filter graph nodes with the v0 query language.
 *
 * @param {BuildGraphResult} graph
 * @param {string} where_clause
 * @returns {{ diagnostics: PatramDiagnostic[], nodes: GraphNode[] }}
 */
export function queryGraph(graph, where_clause) {
  const parse_result = parseWhereClause(where_clause);

  if (!parse_result.success) {
    return {
      diagnostics: [parse_result.diagnostic],
      nodes: [],
    };
  }

  const relation_index = createRelationIndex(graph.edges);
  const graph_nodes = Object.values(graph.nodes).sort(compareGraphNodes);
  const matching_nodes = graph_nodes.filter((graph_node) =>
    parse_result.predicates.every((predicate) =>
      predicate(graph_node, relation_index),
    ),
  );

  return {
    diagnostics: [],
    nodes: matching_nodes,
  };
}

/**
 * @param {string} where_clause
 * @returns {{
 *   success: true,
 *   predicates: Array<(graph_node: GraphNode, relation_index: Map<string, Set<string>>) => boolean>
 * } | {
 *   success: false,
 *   diagnostic: PatramDiagnostic
 * }}
 */
function parseWhereClause(where_clause) {
  const tokens = tokenizeWhereClause(where_clause);

  if (tokens.length === 0) {
    return {
      diagnostic: createQueryDiagnostic(1, 'Query must not be empty.'),
      success: false,
    };
  }

  /** @type {Array<(graph_node: GraphNode, relation_index: Map<string, Set<string>>) => boolean>} */
  const predicates = [];
  let should_expect_term = true;
  let is_negated = false;

  for (const token of tokens) {
    if (token.value !== 'and') {
      if (!should_expect_term) {
        return {
          diagnostic: createQueryDiagnostic(
            token.column,
            `Unsupported query token "${token.value}".`,
          ),
          success: false,
        };
      }

      if (token.value === 'not') {
        is_negated = true;
        continue;
      }

      const predicate_result = createPredicate(token, is_negated);

      if (!predicate_result.success) {
        return predicate_result;
      }

      predicates.push(predicate_result.predicate);
      is_negated = false;
      should_expect_term = false;
      continue;
    }

    if (should_expect_term) {
      return {
        diagnostic: createQueryDiagnostic(
          token.column,
          `Unsupported query token "${token.value}".`,
        ),
        success: false,
      };
    }

    should_expect_term = true;
  }

  if (should_expect_term) {
    return {
      diagnostic: createQueryDiagnostic(
        where_clause.length + 1,
        'Expected a query term.',
      ),
      success: false,
    };
  }

  return { predicates, success: true };
}

/**
 * @param {{ value: string, column: number }} token
 * @param {boolean} is_negated
 * @returns {{
 *   success: true,
 *   predicate: (graph_node: GraphNode, relation_index: Map<string, Set<string>>) => boolean
 * } | {
 *   success: false,
 *   diagnostic: PatramDiagnostic
 * }}
 */
function createPredicate(token, is_negated) {
  const query_term = token.value;
  const field_predicate = createFieldOrTitlePredicate(query_term, is_negated);

  if (field_predicate) {
    return {
      predicate: field_predicate,
      success: true,
    };
  }

  if (/^[a-z_]+:\*$/u.test(query_term)) {
    return {
      predicate: createRelationPredicate(query_term.slice(0, -2), is_negated),
      success: true,
    };
  }

  return {
    diagnostic: createQueryDiagnostic(
      token.column,
      `Unsupported query token "${token.value}".`,
    ),
    success: false,
  };
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
 * @param {number} column_number
 * @param {string} message
 * @returns {PatramDiagnostic}
 */
function createQueryDiagnostic(column_number, message) {
  return {
    code: 'query.invalid',
    column: column_number,
    level: 'error',
    line: 1,
    message,
    path: '<query>',
  };
}

/**
 * @param {string} where_clause
 * @returns {{ value: string, column: number }[]}
 */
function tokenizeWhereClause(where_clause) {
  return [...where_clause.matchAll(/\S+/gu)].map((token_match) => ({
    column: (token_match.index ?? 0) + 1,
    value: token_match[0],
  }));
}

/**
 * @param {string} query_term
 * @param {boolean} is_negated
 * @returns {((graph_node: GraphNode) => boolean) | null}
 */
function createFieldOrTitlePredicate(query_term, is_negated) {
  if (query_term.startsWith('kind=')) {
    return createFieldPredicate(
      'kind',
      query_term.slice('kind='.length),
      is_negated,
    );
  }

  if (query_term.startsWith('status=')) {
    return createFieldPredicate(
      'status',
      query_term.slice('status='.length),
      is_negated,
    );
  }

  if (query_term.startsWith('path=')) {
    return createFieldPredicate(
      'path',
      query_term.slice('path='.length),
      is_negated,
    );
  }

  if (query_term.startsWith('path^=')) {
    return createPathPrefixPredicate(
      query_term.slice('path^='.length),
      is_negated,
    );
  }

  if (query_term.startsWith('title~')) {
    return createTitlePredicate(query_term.slice('title~'.length), is_negated);
  }

  return null;
}

/**
 * @param {GraphNode} left_node
 * @param {GraphNode} right_node
 * @returns {number}
 */
function compareGraphNodes(left_node, right_node) {
  return left_node.id.localeCompare(right_node.id, 'en');
}
