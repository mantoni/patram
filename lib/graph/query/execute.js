/* eslint-disable max-lines */
/**
 * @import { BuildGraphResult, GraphNode } from '../build-graph.types.ts';
 * @import { PatramDiagnostic, PatramRepoConfig } from '../../config/load-patram-config.types.ts';
 * @import {
 *   ParsedAggregateTerm,
 *   ParsedExpression,
 *   ParsedFieldSetTerm,
 *   ParsedFieldTerm,
 *   ParsedRelationTargetTerm,
 *   ParsedTerm,
 *   ParsedTraversalTerm,
 * } from '../parse-where-clause.types.ts';
 */

import { matchesGlob } from 'node:path';

import {
  getGraphNodeClassName,
  getGraphNodeId,
  getGraphNodeMetadataValue,
  getGraphNodePath,
} from '../graph-node.js';
import { getQuerySemanticDiagnostics } from './inspect.js';
import { parseQueryExpression } from './parse-query.js';

/**
 * Query graph filtering.
 *
 * Applies the v0 where-clause language to graph nodes and keeps pagination
 * separate from matching.
 *
 * kind: graph
 * status: active
 * uses_term: ../../../docs/reference/terms/graph.md
 * uses_term: ../../../docs/reference/terms/query.md
 * tracked_in: ../../../docs/plans/v0/source-anchor-dogfooding.md
 * decided_by: ../../../docs/decisions/query-language.md
 * implements: ../../../docs/tasks/v0/query-command.md
 * @patram
 * @see {@link ../../../docs/decisions/query-language.md}
 * @see {@link ../load-project-graph.js}
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
 *   bindings?: Record<string, string>,
 *   limit?: number,
 *   offset?: number,
 * }} QueryGraphOptions
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
 * @param {PatramRepoConfig | QueryGraphOptions=} repo_config_or_query_options
 * @param {QueryGraphOptions=} query_options
 * @returns {{ diagnostics: PatramDiagnostic[], nodes: GraphNode[], total_count: number }}
 */
export function queryGraph(
  graph,
  where_clause,
  repo_config_or_query_options = {},
  query_options = {},
) {
  const { query_options: resolved_query_options, repo_config } =
    resolveQueryGraphOptions(repo_config_or_query_options, query_options);
  const parse_result = parseQueryExpression(where_clause, repo_config, {
    bindings: resolved_query_options.bindings,
  });

  if (!parse_result.success) {
    return {
      diagnostics: [parse_result.diagnostic],
      nodes: [],
      total_count: 0,
    };
  }

  if (repo_config) {
    const diagnostics = getQuerySemanticDiagnostics(
      repo_config,
      { kind: 'ad_hoc' },
      parse_result.expression,
    );

    if (diagnostics.length > 0) {
      return {
        diagnostics,
        nodes: [],
        total_count: 0,
      };
    }
  }

  const evaluation_context = {
    nodes: graph.nodes,
    relation_indexes: createRelationIndexes(graph.edges),
  };
  const graph_nodes = collectCanonicalGraphNodes(graph.nodes).sort(
    compareGraphNodes,
  );
  const matching_nodes = graph_nodes.filter((graph_node) =>
    matchesExpression(graph_node, parse_result.expression, evaluation_context),
  );
  const paginated_nodes = paginateNodes(matching_nodes, resolved_query_options);

  return {
    diagnostics: [],
    nodes: paginated_nodes,
    total_count: matching_nodes.length,
  };
}

/**
 * @param {GraphNode} graph_node
 * @param {ParsedExpression} expression
 * @param {EvaluationContext} evaluation_context
 * @returns {boolean}
 */
function matchesExpression(graph_node, expression, evaluation_context) {
  if (expression.kind === 'and') {
    return expression.expressions.every((subexpression) =>
      matchesExpression(graph_node, subexpression, evaluation_context),
    );
  }

  if (expression.kind === 'or') {
    return expression.expressions.some((subexpression) =>
      matchesExpression(graph_node, subexpression, evaluation_context),
    );
  }

  if (expression.kind === 'not') {
    return !matchesExpression(
      graph_node,
      expression.expression,
      evaluation_context,
    );
  }

  if (expression.kind === 'term') {
    return matchesTerm(graph_node, expression.term, evaluation_context);
  }

  throw new Error('Unsupported parsed boolean expression.');
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
      getGraphNodeId(graph_node),
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
    getGraphNodeId(graph_node),
    term.traversal,
    evaluation_context,
  );
  const matching_count = related_nodes.filter((related_node) =>
    matchesExpression(related_node, term.expression, evaluation_context),
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
// eslint-disable-next-line complexity
function matchesFieldTerm(graph_node, term) {
  const field_values = getGraphNodeFieldValues(graph_node, term.field_name);

  if (term.operator === '=') {
    return field_values.some((field_value) => field_value === term.value);
  }

  if (term.operator === '<>') {
    return field_values.every((field_value) => field_value !== term.value);
  }

  if (term.operator === '^=') {
    return field_values.some((field_value) =>
      field_value.startsWith(term.value),
    );
  }

  if (term.operator === '$=') {
    return field_values.some((field_value) => field_value.endsWith(term.value));
  }

  if (term.operator === '*=') {
    return field_values.some((field_value) =>
      matchesGlob(field_value, term.value),
    );
  }

  if (term.operator === '~') {
    const term_value = term.value.toLocaleLowerCase('en');

    return field_values.some((field_value) =>
      field_value.toLocaleLowerCase('en').includes(term_value),
    );
  }

  if (term.operator === '<' || term.operator === '<=') {
    return field_values.some((field_value) =>
      compareFieldValues(
        field_value,
        /** @type {'<' | '<='} */ (term.operator),
        term.value,
      ),
    );
  }

  if (term.operator === '>' || term.operator === '>=') {
    return field_values.some((field_value) =>
      compareFieldValues(
        field_value,
        /** @type {'>' | '>='} */ (term.operator),
        term.value,
      ),
    );
  }

  throw new Error('Unsupported parsed where clause.');
}

/**
 * @param {GraphNode} graph_node
 * @param {ParsedFieldSetTerm} term
 * @returns {boolean}
 */
function matchesFieldSetTerm(graph_node, term) {
  const field_values = getGraphNodeFieldValues(graph_node, term.field_name);
  const is_member = field_values.some((field_value) =>
    term.values.includes(field_value),
  );

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
    getGraphNodeId(graph_node),
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
 * @param {BuildGraphResult['nodes']} graph_nodes
 * @returns {GraphNode[]}
 */
function collectCanonicalGraphNodes(graph_nodes) {
  /** @type {Map<string, GraphNode>} */
  const canonical_nodes = new Map();

  for (const graph_node of Object.values(graph_nodes)) {
    const graph_node_id = getGraphNodeId(graph_node);

    if (!graph_node_id) {
      continue;
    }

    canonical_nodes.set(graph_node_id, graph_node);
  }

  return [...canonical_nodes.values()];
}

/**
 * @param {number} left_value
 * @param {'<' | '<=' | '<>' | '=' | '>' | '>='} comparison
 * @param {number} right_value
 * @returns {boolean}
 */
function compareNumbers(left_value, comparison, right_value) {
  if (comparison === '<>') {
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
  return getGraphNodeId(left_node).localeCompare(
    getGraphNodeId(right_node),
    'en',
  );
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

/**
 * @param {GraphNode} graph_node
 * @param {string} field_name
 * @returns {string[]}
 */
function getGraphNodeFieldValues(graph_node, field_name) {
  const structural_value = getStructuralFieldValue(graph_node, field_name);

  if (structural_value !== undefined) {
    return [structural_value];
  }

  if (field_name === '$path' || field_name === 'title') {
    return [];
  }

  return normalizeFieldValues(
    getGraphNodeMetadataValue(graph_node, field_name),
  );
}

/**
 * @param {GraphNode} graph_node
 * @param {string} field_name
 * @returns {string | undefined}
 */
function getStructuralFieldValue(graph_node, field_name) {
  const node_path = getGraphNodePath(graph_node);
  const node_title = getGraphNodeMetadataValue(graph_node, 'title');

  return {
    $class: getGraphNodeClassName(graph_node),
    $id: getGraphNodeId(graph_node),
    $path: node_path,
    title: Array.isArray(node_title) ? node_title[0] : node_title,
  }[field_name];
}

/**
 * @param {unknown} field_value
 * @returns {string[]}
 */
function normalizeFieldValues(field_value) {
  if (Array.isArray(field_value)) {
    return field_value.flatMap(getScalarFieldValue);
  }

  return getScalarFieldValue(field_value);
}

/**
 * @param {unknown} field_value
 * @returns {string[]}
 */
function getScalarFieldValue(field_value) {
  if (
    typeof field_value === 'string' ||
    typeof field_value === 'number' ||
    typeof field_value === 'boolean'
  ) {
    return [String(field_value)];
  }

  return [];
}

/**
 * @param {PatramRepoConfig | QueryGraphOptions} repo_config_or_query_options
 * @param {QueryGraphOptions} query_options
 * @returns {{ query_options: QueryGraphOptions, repo_config: PatramRepoConfig | null }}
 */
function resolveQueryGraphOptions(repo_config_or_query_options, query_options) {
  if (isRepoConfig(repo_config_or_query_options)) {
    return {
      query_options,
      repo_config: repo_config_or_query_options,
    };
  }

  return {
    query_options: repo_config_or_query_options,
    repo_config: null,
  };
}

/**
 * @param {PatramRepoConfig | QueryGraphOptions} value
 * @returns {value is PatramRepoConfig}
 */
function isRepoConfig(value) {
  return 'include' in value || 'queries' in value;
}

/**
 * @param {string} left_value
 * @param {'<' | '<=' | '>' | '>='} comparison
 * @param {string} right_value
 * @returns {boolean}
 */
function compareFieldValues(left_value, comparison, right_value) {
  const numeric_comparison = compareNumericFieldValues(
    left_value,
    comparison,
    right_value,
  );

  if (numeric_comparison !== null) {
    return numeric_comparison;
  }

  return compareComparableValues(
    left_value.localeCompare(right_value, 'en'),
    comparison,
  );
}

/**
 * @param {string} left_value
 * @param {'<' | '<=' | '>' | '>='} comparison
 * @param {string} right_value
 * @returns {boolean | null}
 */
function compareNumericFieldValues(left_value, comparison, right_value) {
  const left_number = Number(left_value);
  const right_number = Number(right_value);

  if (
    !Number.isFinite(left_number) ||
    !Number.isFinite(right_number) ||
    left_value.trim().length === 0 ||
    right_value.trim().length === 0
  ) {
    return null;
  }

  return compareComparableValues(left_number - right_number, comparison);
}

/**
 * @param {number} comparison_result
 * @param {'<' | '<=' | '>' | '>='} comparison
 * @returns {boolean}
 */
function compareComparableValues(comparison_result, comparison) {
  if (comparison === '<') {
    return comparison_result < 0;
  }

  if (comparison === '<=') {
    return comparison_result <= 0;
  }

  if (comparison === '>') {
    return comparison_result > 0;
  }

  return comparison_result >= 0;
}
