/* eslint-disable max-lines */
/**
 * @import {
 *   ParsedAggregateComparison,
 *   ParsedAggregateTerm,
 *   ParsedExpression,
 *   ParsedFieldTerm,
 *   ParseWhereClauseResult,
 * } from '../parse-where-clause.types.ts';
 * @import { CypherExpressionResult, CypherParserState, CypherToken } from './cypher.types.ts';
 */

import {
  collapseAndExpressions,
  collapseBooleanExpression,
  createFieldExpression,
  createFieldSetExpression,
  createNodeLabelExpression,
  isAggregateComparison,
} from './cypher-support.js';
import {
  consumeKeyword,
  consumeSymbol,
  consumeToken,
  expectKeyword,
  expectSymbol,
  failAtCurrent,
  peekKeyword,
  peekToken,
} from './cypher-reader.js';
import {
  parseCypherListValue,
  parseCypherScalarValue,
  parseNodePattern,
  parseSubqueryAggregate,
} from './parse-cypher-patterns.js';

/**
 * @param {CypherParserState} parser_state
 * @returns {ParseWhereClauseResult}
 */
export function parseCypherExpression(parser_state) {
  expectKeyword(parser_state, 'MATCH');
  const root_node = parseNodePattern(parser_state);

  if (!root_node.variable_name) {
    return failAtCurrent(
      parser_state,
      'Cypher root MATCH requires a variable.',
    );
  }

  parser_state.root_variable_name = root_node.variable_name;

  /** @type {ParsedExpression[]} */
  const expressions = [];
  const label_expression = createNodeLabelExpression(
    root_node,
    parser_state.repo_config,
  );

  if (label_expression) {
    expressions.push(label_expression);
  }

  if (consumeKeyword(parser_state, 'WHERE')) {
    const where_result = parseCypherBooleanExpression(parser_state);

    if (!where_result.success) {
      return where_result;
    }

    expressions.push(where_result.expression);
  }

  expectKeyword(parser_state, 'RETURN');
  return resolveReturnExpression(
    parser_state,
    root_node.variable_name,
    expressions,
  );
}

/**
 * @param {CypherParserState} parser_state
 * @returns {CypherExpressionResult}
 */
function parseCypherBooleanExpression(parser_state) {
  return parseCypherOrExpression(parser_state);
}

/**
 * @param {CypherParserState} parser_state
 * @returns {CypherExpressionResult}
 */
function parseCypherOrExpression(parser_state) {
  return parseBooleanExpression(
    parser_state,
    'OR',
    'or',
    parseCypherAndExpression,
  );
}

/**
 * @param {CypherParserState} parser_state
 * @returns {CypherExpressionResult}
 */
function parseCypherAndExpression(parser_state) {
  return parseBooleanExpression(
    parser_state,
    'AND',
    'and',
    parseCypherUnaryExpression,
  );
}

/**
 * @param {CypherParserState} parser_state
 * @returns {CypherExpressionResult}
 */
function parseCypherUnaryExpression(parser_state) {
  if (!consumeKeyword(parser_state, 'NOT')) {
    return parseCypherPrimaryExpression(parser_state);
  }

  const expression_result = parseCypherUnaryExpression(parser_state);

  if (!expression_result.success) {
    return expression_result;
  }

  return {
    expression: {
      expression: expression_result.expression,
      kind: 'not',
    },
    success: true,
  };
}

/**
 * @param {CypherParserState} parser_state
 * @returns {CypherExpressionResult}
 */
function parseCypherPrimaryExpression(parser_state) {
  if (consumeSymbol(parser_state, '(')) {
    return parseGroupedExpression(parser_state);
  }

  if (peekKeyword(parser_state, 'EXISTS')) {
    return parseExistsSubquery(parser_state);
  }

  if (peekKeyword(parser_state, 'COUNT')) {
    return parseCountSubquery(parser_state);
  }

  return parsePropertyPredicate(parser_state);
}

/**
 * @param {CypherParserState} parser_state
 * @returns {CypherExpressionResult}
 */
function parseExistsSubquery(parser_state) {
  const exists_token = consumeToken(parser_state);

  if (!exists_token) {
    return failAtCurrent(parser_state, 'Expected EXISTS.');
  }

  const aggregate_result = parseSubqueryAggregate(
    parser_state,
    exists_token.column,
    'any',
    parseCypherBooleanExpression,
  );

  if (!aggregate_result.success) {
    return aggregate_result;
  }

  return createAggregateExpression(aggregate_result.term);
}

/**
 * @param {CypherParserState} parser_state
 * @returns {CypherExpressionResult}
 */
function parseCountSubquery(parser_state) {
  const count_token = consumeToken(parser_state);

  if (!count_token) {
    return failAtCurrent(parser_state, 'Expected COUNT.');
  }

  const aggregate_result = parseSubqueryAggregate(
    parser_state,
    count_token.column,
    'count',
    parseCypherBooleanExpression,
  );

  if (!aggregate_result.success) {
    return aggregate_result;
  }

  const comparison_result = parseCountComparison(parser_state);

  if (!comparison_result.success) {
    return comparison_result;
  }

  assignCountComparison(aggregate_result.term, comparison_result);
  return createAggregateExpression(aggregate_result.term);
}

/**
 * @param {CypherParserState} parser_state
 * @returns {CypherExpressionResult}
 */
function parsePropertyPredicate(parser_state) {
  const field_reference = parsePredicateLeftHandSide(parser_state);

  if (!field_reference.success) {
    return field_reference;
  }

  const operator_result = parsePredicateOperator(parser_state);

  if (!operator_result.success) {
    return operator_result;
  }

  if (operator_result.kind === 'scalar') {
    return createFieldExpression(
      field_reference.field_name,
      operator_result.operator,
      parseCypherScalarValue(parser_state),
      field_reference.column,
    );
  }

  return createFieldSetExpression(
    field_reference.field_name,
    operator_result.operator,
    parseCypherListValue(parser_state),
    field_reference.column,
  );
}

/**
 * @param {CypherParserState} parser_state
 * @returns {{ success: true, column: number, field_name: string } | ReturnType<typeof failAtCurrent>}
 */
function parsePredicateLeftHandSide(parser_state) {
  const identifier_token = consumeToken(parser_state);

  if (!identifier_token || identifier_token.kind !== 'identifier') {
    return failAtCurrent(parser_state, 'Expected a Cypher predicate.');
  }

  if (peekToken(parser_state)?.value === '(') {
    return parseStructuralFunctionPredicate(parser_state, identifier_token);
  }

  if (peekToken(parser_state)?.value !== '.') {
    return failAtCurrent(parser_state, 'Expected a Cypher predicate.');
  }

  expectSymbol(parser_state, '.');
  const field_token = consumeToken(parser_state);

  if (!field_token || field_token.kind !== 'identifier') {
    return failAtCurrent(parser_state, 'Expected a property name.');
  }

  return {
    column: field_token.column,
    field_name: field_token.value,
    success: true,
  };
}

/**
 * @param {CypherParserState} parser_state
 * @param {CypherToken} identifier_token
 * @returns {{ success: true, column: number, field_name: string } | ReturnType<typeof failAtCurrent>}
 */
function parseStructuralFunctionPredicate(parser_state, identifier_token) {
  const field_name = resolveStructuralFunctionFieldName(identifier_token.value);

  if (!field_name) {
    return failAtCurrent(parser_state, 'Expected a Cypher predicate.');
  }

  expectSymbol(parser_state, '(');

  const variable_token = consumeToken(parser_state);

  if (!variable_token || variable_token.kind !== 'identifier') {
    return failAtCurrent(parser_state, 'Expected a variable name.');
  }

  expectSymbol(parser_state, ')');

  return {
    column: identifier_token.column,
    field_name,
    success: true,
  };
}

/**
 * @param {CypherParserState} parser_state
 * @param {string} keyword
 * @param {'and' | 'or'} kind
 * @param {(parser_state: CypherParserState) => CypherExpressionResult} parse_next_expression
 * @returns {CypherExpressionResult}
 */
function parseBooleanExpression(
  parser_state,
  keyword,
  kind,
  parse_next_expression,
) {
  const first_result = parse_next_expression(parser_state);

  if (!first_result.success) {
    return first_result;
  }

  /** @type {ParsedExpression[]} */
  const expressions = [first_result.expression];

  while (consumeKeyword(parser_state, keyword)) {
    const next_result = parse_next_expression(parser_state);

    if (!next_result.success) {
      return next_result;
    }

    expressions.push(next_result.expression);
  }

  return {
    expression: collapseBooleanExpression(kind, expressions),
    success: true,
  };
}

/**
 * @param {CypherParserState} parser_state
 * @returns {CypherExpressionResult}
 */
function parseGroupedExpression(parser_state) {
  const expression_result = parseCypherBooleanExpression(parser_state);

  if (!expression_result.success) {
    return expression_result;
  }

  expectSymbol(parser_state, ')');
  return expression_result;
}

/**
 * @param {CypherParserState} parser_state
 * @returns {{ success: true, comparison: ParsedAggregateComparison, value: number } | ReturnType<typeof failAtCurrent>}
 */
function parseCountComparison(parser_state) {
  const comparison = resolveAggregateComparison(consumeToken(parser_state));

  if (!comparison) {
    return failAtCurrent(parser_state, 'Expected a count comparison operator.');
  }

  const value_token = consumeToken(parser_state);

  if (!value_token || value_token.kind !== 'number') {
    return failAtCurrent(parser_state, 'Expected a count comparison value.');
  }

  return {
    comparison,
    success: true,
    value: Number.parseInt(value_token.value, 10),
  };
}

/**
 * @param {CypherParserState} parser_state
 * @returns {{
 *   success: true,
 *   kind: 'scalar',
 *   operator: ParsedFieldTerm['operator'],
 * } | {
 *   success: true,
 *   kind: 'set',
 *   operator: 'in' | 'not in',
 * } | ReturnType<typeof failAtCurrent>}
 */
function parsePredicateOperator(parser_state) {
  if (consumeKeyword(parser_state, 'STARTS')) {
    expectKeyword(parser_state, 'WITH');
    return {
      kind: 'scalar',
      operator: '^=',
      success: true,
    };
  }

  if (consumeKeyword(parser_state, 'ENDS')) {
    expectKeyword(parser_state, 'WITH');
    return {
      kind: 'scalar',
      operator: '$=',
      success: true,
    };
  }

  if (consumeKeyword(parser_state, 'CONTAINS')) {
    return {
      kind: 'scalar',
      operator: '~',
      success: true,
    };
  }

  if (consumeKeyword(parser_state, 'NOT')) {
    expectKeyword(parser_state, 'IN');
    return {
      kind: 'set',
      operator: 'not in',
      success: true,
    };
  }

  if (consumeKeyword(parser_state, 'IN')) {
    return {
      kind: 'set',
      operator: 'in',
      success: true,
    };
  }

  const operator = resolveFieldComparisonOperator(peekToken(parser_state));

  if (!operator) {
    return failAtCurrent(parser_state, 'Expected a Cypher predicate operator.');
  }

  consumeToken(parser_state);

  return {
    kind: 'scalar',
    operator,
    success: true,
  };
}

/**
 * @param {CypherParserState} parser_state
 * @param {string} root_variable_name
 * @param {ParsedExpression[]} expressions
 * @returns {ParseWhereClauseResult}
 */
function resolveReturnExpression(
  parser_state,
  root_variable_name,
  expressions,
) {
  const return_token = consumeToken(parser_state);

  if (!return_token || return_token.kind !== 'identifier') {
    return failAtCurrent(parser_state, 'Expected a return variable.');
  }

  if (return_token.value !== root_variable_name) {
    return failAtCurrent(
      parser_state,
      'Cypher RETURN must return the root MATCH variable.',
    );
  }

  return {
    expression: collapseAndExpressions(expressions),
    success: true,
  };
}

/**
 * @param {ParsedAggregateTerm} aggregate_term
 * @param {{ success: true, comparison: ParsedAggregateComparison, value: number }} comparison_result
 */
function assignCountComparison(aggregate_term, comparison_result) {
  aggregate_term.comparison = comparison_result.comparison;
  aggregate_term.value = comparison_result.value;
}

/**
 * @param {ParsedAggregateTerm} aggregate_term
 * @returns {CypherExpressionResult}
 */
function createAggregateExpression(aggregate_term) {
  return {
    expression: {
      kind: 'term',
      term: aggregate_term,
    },
    success: true,
  };
}

/**
 * @param {CypherToken | undefined} token
 * @returns {ParsedAggregateComparison | undefined}
 */
function resolveAggregateComparison(token) {
  const operator = resolveComparisonOperator(token);

  if (!operator || !isAggregateComparison(operator)) {
    return undefined;
  }

  return operator;
}

/**
 * @param {CypherToken | undefined} token
 * @returns {ParsedFieldTerm['operator'] | undefined}
 */
function resolveFieldComparisonOperator(token) {
  const operator = resolveComparisonOperator(token);

  if (!operator) {
    return undefined;
  }

  return /** @type {ParsedFieldTerm['operator']} */ (operator);
}

/**
 * @param {string} function_name
 * @returns {'$id' | '$path' | undefined}
 */
function resolveStructuralFunctionFieldName(function_name) {
  if (function_name === 'id') {
    return '$id';
  }

  if (function_name === 'path') {
    return '$path';
  }

  return undefined;
}

/**
 * @param {CypherToken | undefined} token
 * @returns {string | undefined}
 */
function resolveComparisonOperator(token) {
  if (!token || token.kind !== 'symbol') {
    return undefined;
  }

  switch (token.value) {
    case '<':
    case '<=':
    case '<>':
    case '=':
    case '>':
    case '>=':
      return token.value;
    default:
      return undefined;
  }
}
