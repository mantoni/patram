/* eslint-disable max-lines */
/**
 * @import {
 *   ParsedAggregateTerm,
 *   ParsedExpression,
 *   ParsedTraversalTerm,
 * } from '../parse-where-clause.types.ts';
 * @import {
 *   CypherAggregateResult,
 *   CypherExpressionResult,
 *   CypherNodePattern,
 *   CypherParserState,
 *   CypherRelationPattern,
 *   CypherSubqueryShapeResult,
 *   CypherToken,
 * } from './cypher.types.ts';
 */

import {
  collapseAndExpressions,
  createAlwaysTrueExpression,
  createNodeLabelExpression,
  relationTypeToRelationName,
} from './cypher-support.js';
import {
  consumeKeyword,
  consumeSymbol,
  consumeToken,
  expectKeyword,
  expectSymbol,
  failAtCurrent,
  peekSymbolAt,
} from './cypher-reader.js';

/**
 * @param {CypherParserState} parser_state
 * @param {number} column
 * @param {'any' | 'count'} aggregate_name
 * @param {(parser_state: CypherParserState) => CypherExpressionResult} parse_boolean_expression
 * @returns {CypherAggregateResult}
 */
export function parseSubqueryAggregate(
  parser_state,
  column,
  aggregate_name,
  parse_boolean_expression,
) {
  expectSymbol(parser_state, '{');
  expectKeyword(parser_state, 'MATCH');

  const first_node = parseNodePattern(parser_state);
  const relation_pattern = parseRelationPattern(parser_state);
  const second_node = parseNodePattern(parser_state);
  const subquery_shape = resolveSubqueryShape(
    parser_state,
    first_node,
    relation_pattern,
    second_node,
  );

  if (!subquery_shape.success) {
    return subquery_shape;
  }

  /** @type {ParsedExpression[]} */
  const nested_expressions = [];
  const label_expression = createNodeLabelExpression(
    subquery_shape.related_node,
    parser_state.repo_config,
  );

  if (label_expression) {
    nested_expressions.push(label_expression);
  }

  if (consumeKeyword(parser_state, 'WHERE')) {
    const nested_result = parse_boolean_expression(parser_state);

    if (!nested_result.success) {
      return nested_result;
    }

    nested_expressions.push(nested_result.expression);
  }

  expectSymbol(parser_state, '}');

  return {
    success: true,
    term: createAggregateTerm(
      aggregate_name,
      column,
      nested_expressions,
      subquery_shape.traversal,
    ),
  };
}

/**
 * @param {CypherParserState} parser_state
 * @returns {CypherNodePattern}
 */
export function parseNodePattern(parser_state) {
  const open_token = expectSymbol(parser_state, '(');
  const identifier_token = consumeOptionalIdentifier(parser_state);
  const variable_name = identifier_token?.value ?? null;
  let label_name = null;

  if (
    variable_name &&
    !peekSymbolAt(parser_state, 0, ':') &&
    !peekSymbolAt(parser_state, 0, ')')
  ) {
    throw new Error('Unexpected token while parsing a node pattern.');
  }

  if (consumeSymbol(parser_state, ':')) {
    label_name = parseIdentifierValue(parser_state, 'Expected a label name.');
  }

  expectSymbol(parser_state, ')');

  return {
    column: open_token.column,
    label_name,
    variable_name,
  };
}

/**
 * @param {CypherParserState} parser_state
 * @returns {CypherRelationPattern}
 */
function parseRelationPattern(parser_state) {
  const first_token = consumeToken(parser_state);

  if (!first_token || first_token.kind !== 'symbol') {
    throw new Error('Expected a relationship pattern.');
  }

  const direction = resolveRelationDirection(first_token.value);

  expectSymbol(parser_state, '[');
  expectSymbol(parser_state, ':');
  const relation_name = parseIdentifierValue(
    parser_state,
    'Expected a relationship type.',
  );

  expectSymbol(parser_state, ']');
  expectSymbol(parser_state, direction === 'out' ? '->' : '-');

  return {
    column: first_token.column,
    direction,
    relation_name: relationTypeToRelationName(relation_name),
  };
}

/**
 * @param {CypherParserState} parser_state
 * @returns {string}
 */
export function parseCypherScalarValue(parser_state) {
  const token = consumeToken(parser_state);

  if (
    token &&
    (token.kind === 'identifier' ||
      token.kind === 'number' ||
      token.kind === 'string')
  ) {
    return token.value;
  }

  throw new Error('Expected a scalar value.');
}

/**
 * @param {CypherParserState} parser_state
 * @returns {string[]}
 */
export function parseCypherListValue(parser_state) {
  expectSymbol(parser_state, '[');
  /** @type {string[]} */
  const values = [];

  while (!consumeSymbol(parser_state, ']')) {
    values.push(parseCypherScalarValue(parser_state));

    if (consumeSymbol(parser_state, ']')) {
      break;
    }

    expectSymbol(parser_state, ',');
  }

  return values;
}

/**
 * @param {CypherParserState} parser_state
 * @param {CypherNodePattern} first_node
 * @param {CypherRelationPattern} relation_pattern
 * @param {CypherNodePattern} second_node
 * @returns {CypherSubqueryShapeResult}
 */
function resolveSubqueryShape(
  parser_state,
  first_node,
  relation_pattern,
  second_node,
) {
  const root_variable_name = parser_state.root_variable_name;

  if (!root_variable_name) {
    throw new Error('Expected a root query variable.');
  }

  if (firstNodeIsRoot(first_node, root_variable_name)) {
    return {
      related_node: second_node,
      success: true,
      traversal: createTraversalTerm(
        relation_pattern.column,
        relation_pattern.direction,
        relation_pattern.relation_name,
      ),
    };
  }

  if (firstNodeIsRoot(second_node, root_variable_name)) {
    return {
      related_node: first_node,
      success: true,
      traversal: createTraversalTerm(
        relation_pattern.column,
        invertDirection(relation_pattern.direction),
        relation_pattern.relation_name,
      ),
    };
  }

  return failAtCurrent(
    parser_state,
    'Cypher subqueries must traverse to or from the root MATCH variable.',
  );
}

/**
 * @param {'any' | 'count'} aggregate_name
 * @param {number} column
 * @param {ParsedExpression[]} nested_expressions
 * @param {ParsedTraversalTerm} traversal
 * @returns {ParsedAggregateTerm}
 */
function createAggregateTerm(
  aggregate_name,
  column,
  nested_expressions,
  traversal,
) {
  return {
    aggregate_name,
    expression: collapseAndExpressions(
      nested_expressions.length > 0
        ? nested_expressions
        : [createAlwaysTrueExpression(column)],
    ),
    kind: 'aggregate',
    traversal,
  };
}

/**
 * @param {number} column
 * @param {'in' | 'out'} direction
 * @param {string} relation_name
 * @returns {ParsedTraversalTerm}
 */
function createTraversalTerm(column, direction, relation_name) {
  return {
    column,
    direction,
    relation_name,
  };
}

/**
 * @param {CypherParserState} parser_state
 * @returns {CypherToken | undefined}
 */
function consumeOptionalIdentifier(parser_state) {
  const token = consumeToken(parser_state);

  if (!token) {
    return undefined;
  }

  if (token.kind === 'identifier') {
    return token;
  }

  parser_state.index -= 1;
  return undefined;
}

/**
 * @param {CypherParserState} parser_state
 * @param {string} message
 * @returns {string}
 */
function parseIdentifierValue(parser_state, message) {
  const token = consumeToken(parser_state);

  if (!token || token.kind !== 'identifier') {
    throw new Error(message);
  }

  return token.value;
}

/**
 * @param {CypherNodePattern} node_pattern
 * @param {string} root_variable_name
 * @returns {boolean}
 */
function firstNodeIsRoot(node_pattern, root_variable_name) {
  return node_pattern.variable_name === root_variable_name;
}

/**
 * @param {'in' | 'out'} direction
 * @returns {'in' | 'out'}
 */
function invertDirection(direction) {
  return direction === 'in' ? 'out' : 'in';
}

/**
 * @param {string} token_value
 * @returns {'in' | 'out'}
 */
function resolveRelationDirection(token_value) {
  if (token_value === '<-') {
    return 'in';
  }

  if (token_value === '-') {
    return 'out';
  }

  throw new Error('Expected a relationship direction.');
}
