/* eslint-disable max-lines */
/**
 * @import { PatramDiagnostic } from '../../config/load-patram-config.types.ts';
 * @import {
 *   ParseWhereClauseResult,
 *   ParsedAggregateComparison,
 *   ParsedAggregateName,
 *   ParsedAggregateTerm,
 *   ParsedExpression,
 *   ParsedFieldName,
 *   ParsedTerm,
 *   ParsedTraversalTerm,
 * } from '../parse-where-clause.types.ts';
 */

/**
 * @typedef {{ bindings: Record<string, string>, index: number, where_clause: string }} ParserState
 */

/**
 * @typedef {{
 *   diagnostic: PatramDiagnostic,
 *   success: false,
 * }} ParseFailureResult
 */

/**
 * @typedef {{
 *   expression: ParsedExpression,
 *   success: true,
 * } | ParseFailureResult} ParseExpressionResult
 */

/**
 * @typedef {{
 *   success: true,
 *   term: ParsedTerm,
 * } | ParseFailureResult} ParseTermResult
 */

/**
 * @typedef {{
 *   success: true,
 *   value: string,
 * } | ParseFailureResult} ParseValueResult
 */

/**
 * Parse one where clause into a structured boolean expression.
 *
 * @param {string} where_clause
 * @param {{ bindings?: Record<string, string> }=} options
 * @returns {ParseWhereClauseResult}
 */
export function parseWhereClause(where_clause, options = {}) {
  /** @type {ParserState} */
  const parser_state = {
    bindings: options.bindings ?? {},
    index: 0,
    where_clause,
  };

  skipWhitespace(parser_state);

  if (isAtEnd(parser_state)) {
    return fail(1, 'Query must not be empty.');
  }

  const expression_result = parseExpression(parser_state, null);

  if (!expression_result.success) {
    return expression_result;
  }

  skipWhitespace(parser_state);

  if (!isAtEnd(parser_state)) {
    return failToken(parser_state);
  }

  return {
    expression: expression_result.expression,
    success: true,
  };
}

/**
 * @param {ParserState} parser_state
 * @param {')' | null} stop_character
 * @returns {ParseExpressionResult}
 */
function parseExpression(parser_state, stop_character) {
  return parseOrExpression(parser_state, stop_character);
}

/**
 * @param {ParserState} parser_state
 * @param {')' | null} stop_character
 * @returns {ParseExpressionResult}
 */
function parseOrExpression(parser_state, stop_character) {
  const first_expression_result = parseAndExpression(
    parser_state,
    stop_character,
  );

  if (!first_expression_result.success) {
    return first_expression_result;
  }

  /** @type {ParsedExpression[]} */
  const expressions = [first_expression_result.expression];

  while (true) {
    skipWhitespace(parser_state);

    if (
      currentCharacter(parser_state) === stop_character ||
      isAtEnd(parser_state)
    ) {
      return collapseBooleanExpression('or', expressions);
    }

    if (!consumeKeyword(parser_state, 'or')) {
      return collapseBooleanExpression('or', expressions);
    }

    skipWhitespace(parser_state);

    if (
      currentCharacter(parser_state) === stop_character ||
      isAtEnd(parser_state)
    ) {
      return failExpectedTerm(parser_state);
    }

    const next_expression_result = parseAndExpression(
      parser_state,
      stop_character,
    );

    if (!next_expression_result.success) {
      return next_expression_result;
    }

    expressions.push(next_expression_result.expression);
  }
}

/**
 * @param {ParserState} parser_state
 * @param {')' | null} stop_character
 * @returns {ParseExpressionResult}
 */
function parseAndExpression(parser_state, stop_character) {
  const first_expression_result = parseUnaryExpression(
    parser_state,
    stop_character,
  );

  if (!first_expression_result.success) {
    return first_expression_result;
  }

  /** @type {ParsedExpression[]} */
  const expressions = [first_expression_result.expression];

  while (true) {
    skipWhitespace(parser_state);

    if (
      currentCharacter(parser_state) === stop_character ||
      isAtEnd(parser_state)
    ) {
      return collapseBooleanExpression('and', expressions);
    }

    if (!consumeKeyword(parser_state, 'and')) {
      return collapseBooleanExpression('and', expressions);
    }

    skipWhitespace(parser_state);

    if (
      currentCharacter(parser_state) === stop_character ||
      isAtEnd(parser_state)
    ) {
      return failExpectedTerm(parser_state);
    }

    const next_expression_result = parseUnaryExpression(
      parser_state,
      stop_character,
    );

    if (!next_expression_result.success) {
      return next_expression_result;
    }

    expressions.push(next_expression_result.expression);
  }
}

/**
 * @param {ParserState} parser_state
 * @param {')' | null} stop_character
 * @returns {ParseExpressionResult}
 */
function parseUnaryExpression(parser_state, stop_character) {
  skipWhitespace(parser_state);
  const start_index = parser_state.index;

  if (!consumeKeyword(parser_state, 'not')) {
    return parsePrimaryExpression(parser_state, stop_character);
  }

  const whitespace_length = skipWhitespace(parser_state);

  if (whitespace_length === 0 && currentCharacter(parser_state) !== '(') {
    return fail(
      start_index + 1,
      `Unsupported query token "${readToken(parser_state, start_index)}".`,
    );
  }

  if (
    currentCharacter(parser_state) === stop_character ||
    isAtEnd(parser_state)
  ) {
    return failExpectedTerm(parser_state);
  }

  const expression_result = parseUnaryExpression(parser_state, stop_character);

  if (!expression_result.success) {
    return expression_result;
  }

  return successExpression({
    expression: expression_result.expression,
    kind: 'not',
  });
}

/**
 * @param {ParserState} parser_state
 * @param {')' | null} stop_character
 * @returns {ParseExpressionResult}
 */
function parsePrimaryExpression(parser_state, stop_character) {
  skipWhitespace(parser_state);

  if (
    currentCharacter(parser_state) === stop_character ||
    isAtEnd(parser_state)
  ) {
    return failExpectedTerm(parser_state);
  }

  if (consumeOperator(parser_state, '(')) {
    const expression_result = parseExpression(parser_state, ')');

    if (!expression_result.success) {
      return expression_result;
    }

    if (!consumeOperator(parser_state, ')')) {
      return failToken(parser_state);
    }

    return expression_result;
  }

  const term_result = parseTerm(parser_state);

  if (!term_result.success) {
    return term_result;
  }

  return successExpression({
    kind: 'term',
    term: term_result.term,
  });
}

/**
 * @param {'and' | 'or'} kind
 * @param {ParsedExpression[]} expressions
 * @returns {ParseExpressionResult}
 */
function collapseBooleanExpression(kind, expressions) {
  if (expressions.length === 1) {
    return successExpression(expressions[0]);
  }

  return successExpression({
    expressions,
    kind,
  });
}

/**
 * @param {ParserState} parser_state
 * @returns {ParseTermResult}
 */
function parseTerm(parser_state) {
  return parseAggregate(parser_state) ?? parseAtomicTerm(parser_state);
}

/**
 * @param {ParserState} parser_state
 * @returns {ParseTermResult | null}
 */
function parseAggregate(parser_state) {
  const start_index = parser_state.index;
  const aggregate_name = parseIdentifier(parser_state);

  if (
    aggregate_name !== 'any' &&
    aggregate_name !== 'count' &&
    aggregate_name !== 'none'
  ) {
    parser_state.index = start_index;
    return null;
  }

  skipWhitespace(parser_state);

  if (currentCharacter(parser_state) !== '(') {
    parser_state.index = start_index;
    return null;
  }

  parser_state.index += 1;
  skipWhitespace(parser_state);

  const traversal_result = parseTraversal(parser_state);

  if (!traversal_result.success) {
    return traversal_result;
  }

  if (!consumeOperator(parser_state, ',')) {
    return failToken(parser_state);
  }

  skipWhitespace(parser_state);
  const expression_result = parseExpression(parser_state, ')');

  if (!expression_result.success) {
    return expression_result;
  }

  if (!consumeOperator(parser_state, ')')) {
    return failToken(parser_state);
  }

  return createAggregateTerm(
    parser_state,
    aggregate_name,
    traversal_result.traversal,
    expression_result.expression,
  );
}

/**
 * @param {ParserState} parser_state
 * @returns {ParseTermResult}
 */
function parseAtomicTerm(parser_state) {
  const start_index = parser_state.index;
  const field_or_relation_name = parseIdentifier(parser_state);

  if (!field_or_relation_name) {
    return failToken(parser_state);
  }

  return parseOperatorTerm(parser_state, start_index, field_or_relation_name);
}

/**
 * @param {ParserState} parser_state
 * @param {ParsedAggregateName} aggregate_name
 * @param {ParsedTraversalTerm} traversal
 * @param {ParsedExpression} expression
 * @returns {ParseTermResult}
 */
function createAggregateTerm(
  parser_state,
  aggregate_name,
  traversal,
  expression,
) {
  /** @type {ParsedAggregateTerm} */
  const aggregate_term = {
    aggregate_name,
    expression,
    kind: 'aggregate',
    traversal,
  };

  if (aggregate_name !== 'count') {
    return successTerm(aggregate_term);
  }

  const count_tail = parseCountTail(parser_state);

  if (!count_tail) {
    return failToken(parser_state);
  }

  return successTerm({
    ...aggregate_term,
    comparison: count_tail.comparison,
    value: count_tail.value,
  });
}

/**
 * @param {ParserState} parser_state
 * @param {number} start_index
 * @param {ParsedFieldName | string} field_name
 * @returns {ParseTermResult | null}
 */
function parseFieldSet(parser_state, start_index, field_name) {
  const operator_start_index = parser_state.index;

  if (!consumeRequiredWhitespace(parser_state)) {
    return null;
  }

  const operator = parseSetOperator(parser_state);

  if (!operator) {
    parser_state.index = operator_start_index;
    return null;
  }

  if (!consumeRequiredWhitespace(parser_state)) {
    return failToken(parser_state);
  }

  const values = parseList(parser_state);

  if (!values) {
    return failToken(parser_state);
  }

  if (!Array.isArray(values)) {
    return values;
  }

  return successTerm({
    column: start_index + 1,
    field_name,
    kind: 'field_set',
    operator,
    values,
  });
}

/**
 * @param {ParserState} parser_state
 * @param {number} start_index
 * @param {string} field_or_relation_name
 * @returns {ParseTermResult}
 */
function parseOperatorTerm(parser_state, start_index, field_or_relation_name) {
  const field_set = parseFieldSet(
    parser_state,
    start_index,
    field_or_relation_name,
  );

  if (field_set) {
    return field_set;
  }

  const prefix_term = parsePrefixTerm(
    parser_state,
    start_index,
    field_or_relation_name,
  );

  if (prefix_term) {
    return prefix_term;
  }

  const glob_term = parseGlobTerm(
    parser_state,
    start_index,
    field_or_relation_name,
  );

  if (glob_term) {
    return glob_term;
  }

  const contains_term = parseContainsTerm(
    parser_state,
    start_index,
    field_or_relation_name,
  );

  if (contains_term) {
    return contains_term;
  }

  const comparison_term = parseFieldComparisonTerm(
    parser_state,
    start_index,
    field_or_relation_name,
  );

  if (comparison_term) {
    return comparison_term;
  }

  const equality_term = parseEqualityTerm(
    parser_state,
    start_index,
    field_or_relation_name,
  );

  if (equality_term) {
    return equality_term;
  }

  if (consumeOperator(parser_state, ':*')) {
    return successTerm({
      column: start_index + 1,
      kind: 'relation',
      relation_name: field_or_relation_name,
    });
  }

  parser_state.index = start_index;
  return failToken(parser_state);
}

/**
 * @param {ParserState} parser_state
 * @returns {{ comparison: ParsedAggregateComparison, value: number } | null}
 */
function parseCountTail(parser_state) {
  if (!consumeRequiredWhitespace(parser_state)) {
    return null;
  }

  const comparison = parseComparison(parser_state);

  if (!comparison || !consumeRequiredWhitespace(parser_state)) {
    return null;
  }

  const value = parseInteger(parser_state);

  return value === null ? null : { comparison, value };
}

/**
 * @param {ParserState} parser_state
 * @returns {{ success: true, traversal: ParsedTraversalTerm } | { diagnostic: PatramDiagnostic, success: false }}
 */
function parseTraversal(parser_state) {
  const column = parser_state.index + 1;
  const direction = parseIdentifier(parser_state);

  if (
    (direction !== 'in' && direction !== 'out') ||
    !consumeOperator(parser_state, ':')
  ) {
    return failToken(parser_state);
  }

  const relation_name = parseIdentifier(parser_state);

  return relation_name
    ? { success: true, traversal: { column, direction, relation_name } }
    : failToken(parser_state);
}

/**
 * @param {ParserState} parser_state
 * @returns {'in' | 'not in' | null}
 */
function parseSetOperator(parser_state) {
  if (consumeKeyword(parser_state, 'in')) {
    return 'in';
  }

  if (
    !consumeKeyword(parser_state, 'not') ||
    !consumeRequiredWhitespace(parser_state)
  ) {
    return null;
  }

  return consumeKeyword(parser_state, 'in') ? 'not in' : null;
}

/**
 * @param {ParserState} parser_state
 * @param {number} start_index
 * @param {string} field_name
 * @returns {ParseTermResult | null}
 */
function parsePrefixTerm(parser_state, start_index, field_name) {
  if (!consumeOperator(parser_state, '^=')) {
    return null;
  }

  skipWhitespace(parser_state);
  const value_result = parseResolvedBareValue(parser_state);

  if (!value_result) {
    return failToken(parser_state);
  }

  if (!value_result.success) {
    return value_result;
  }

  return value_result.value
    ? successTerm({
        column: start_index + 1,
        field_name,
        kind: 'field',
        operator: '^=',
        value: value_result.value,
      })
    : failToken(parser_state);
}

/**
 * @param {ParserState} parser_state
 * @param {number} start_index
 * @param {string} field_name
 * @returns {ParseTermResult | null}
 */
function parseContainsTerm(parser_state, start_index, field_name) {
  if (!consumeOperator(parser_state, '~')) {
    return null;
  }

  skipWhitespace(parser_state);
  const value_result = parseResolvedBareValue(parser_state);

  if (!value_result) {
    return failToken(parser_state);
  }

  if (!value_result.success) {
    return value_result;
  }

  return value_result.value
    ? successTerm({
        column: start_index + 1,
        field_name,
        kind: 'field',
        operator: '~',
        value: value_result.value,
      })
    : failToken(parser_state);
}

/**
 * @param {ParserState} parser_state
 * @param {number} start_index
 * @param {string} field_name
 * @returns {ParseTermResult | null}
 */
function parseGlobTerm(parser_state, start_index, field_name) {
  if (!consumeOperator(parser_state, '*=')) {
    return null;
  }

  skipWhitespace(parser_state);
  const value_result = parseResolvedBareValue(parser_state);

  if (!value_result) {
    return failToken(parser_state);
  }

  if (!value_result.success) {
    return value_result;
  }

  return value_result.value
    ? successTerm({
        column: start_index + 1,
        field_name,
        kind: 'field',
        operator: '*=',
        value: value_result.value,
      })
    : failToken(parser_state);
}

/**
 * @param {ParserState} parser_state
 * @param {number} start_index
 * @param {string} field_or_relation_name
 * @returns {ParseTermResult | null}
 */
function parseEqualityTerm(parser_state, start_index, field_or_relation_name) {
  if (!consumeOperator(parser_state, '=')) {
    return null;
  }

  skipWhitespace(parser_state);
  const value_result = parseResolvedBareValue(parser_state);

  if (!value_result) {
    return failToken(parser_state);
  }

  if (!value_result.success) {
    return value_result;
  }

  const value = value_result.value;

  if (
    field_or_relation_name.startsWith('$') ||
    field_or_relation_name === 'title' ||
    !value.includes(':')
  ) {
    return successTerm({
      column: start_index + 1,
      field_name: field_or_relation_name,
      kind: 'field',
      operator: '=',
      value,
    });
  }

  return successTerm({
    column: start_index + 1,
    kind: 'relation_target',
    relation_name: field_or_relation_name,
    target_id: value,
  });
}

/**
 * @param {ParserState} parser_state
 * @param {number} start_index
 * @param {string} field_name
 * @returns {ParseTermResult | null}
 */
function parseFieldComparisonTerm(parser_state, start_index, field_name) {
  const operator = parseFieldComparisonOperator(parser_state);

  if (!operator) {
    return null;
  }

  skipWhitespace(parser_state);
  const value_result = parseResolvedBareValue(parser_state);

  if (!value_result) {
    return failToken(parser_state);
  }

  if (!value_result.success) {
    return value_result;
  }

  return successTerm({
    column: start_index + 1,
    field_name,
    kind: 'field',
    operator,
    value: value_result.value,
  });
}

/**
 * @param {ParserState} parser_state
 * @returns {'!=' | '<=' | '>=' | '<' | '>' | null}
 */
function parseFieldComparisonOperator(parser_state) {
  /** @type {Array<'!=' | '<=' | '>=' | '<' | '>'>} */
  const comparisons = ['!=', '<=', '>=', '<', '>'];

  return (
    comparisons.find((value) => consumeOperator(parser_state, value)) ?? null
  );
}

/**
 * @param {ParserState} parser_state
 * @returns {string[] | ParseFailureResult | null}
 */
function parseList(parser_state) {
  if (!consumeOperator(parser_state, '[')) {
    return null;
  }

  /** @type {string[]} */
  const values = [];

  while (true) {
    skipWhitespace(parser_state);

    if (consumeOperator(parser_state, ']')) {
      return values.length > 0 ? values : null;
    }

    const list_value_result = parseResolvedListValue(parser_state);

    if (!list_value_result) {
      return null;
    }

    if (!list_value_result.success) {
      return list_value_result;
    }

    values.push(list_value_result.value);
    skipWhitespace(parser_state);

    if (consumeOperator(parser_state, ']')) {
      return values;
    }

    if (!consumeOperator(parser_state, ',')) {
      return null;
    }
  }
}

/**
 * @param {ParserState} parser_state
 * @returns {ParsedAggregateComparison | null}
 */
function parseComparison(parser_state) {
  /** @type {ParsedAggregateComparison[]} */
  const comparisons = ['>=', '<=', '!=', '=', '>', '<'];

  return (
    comparisons.find((value) => consumeOperator(parser_state, value)) ?? null
  );
}

/**
 * @param {ParserState} parser_state
 * @returns {string | null}
 */
function parseIdentifier(parser_state) {
  return readMatch(parser_state, /^\$?[a-z_][a-z0-9_]*/u);
}

/**
 * @param {ParserState} parser_state
 * @returns {number | null}
 */
function parseInteger(parser_state) {
  const numeric_text = readMatch(parser_state, /^\d+/u);
  return numeric_text ? Number.parseInt(numeric_text, 10) : null;
}

/**
 * @param {ParserState} parser_state
 * @returns {string | null}
 */
function parseBareValue(parser_state) {
  return readMatch(parser_state, /^[^\s\],)]+/u);
}

/**
 * @param {ParserState} parser_state
 * @returns {string | null}
 */
function parseListValue(parser_state) {
  const list_value = readMatch(parser_state, /^[^\s\],][^\],)]*/u);
  return list_value?.trim() || null;
}

/**
 * @param {ParserState} parser_state
 * @returns {ParseValueResult | null}
 */
function parseResolvedBareValue(parser_state) {
  const start_index = parser_state.index;
  const raw_value = parseBareValue(parser_state);

  if (!raw_value) {
    return null;
  }

  return resolveBindingValue(parser_state, raw_value, start_index);
}

/**
 * @param {ParserState} parser_state
 * @returns {ParseValueResult | null}
 */
function parseResolvedListValue(parser_state) {
  const start_index = parser_state.index;
  const raw_value = parseListValue(parser_state);

  if (!raw_value) {
    return null;
  }

  return resolveBindingValue(parser_state, raw_value, start_index);
}

/**
 * @param {ParserState} parser_state
 * @param {string} raw_value
 * @param {number} start_index
 * @returns {ParseValueResult}
 */
function resolveBindingValue(parser_state, raw_value, start_index) {
  if (!raw_value.startsWith('@')) {
    return {
      success: true,
      value: raw_value,
    };
  }

  const binding_name = raw_value.slice(1);

  if (!/^[a-z_][a-z0-9_]*$/u.test(binding_name)) {
    return fail(
      start_index + 1,
      `Unsupported query binding "${raw_value}".`,
      'query.invalid',
    );
  }

  const binding_value = parser_state.bindings[binding_name];

  if (binding_value === undefined) {
    return fail(
      start_index + 1,
      `Missing query binding "${binding_name}".`,
      'query.binding_missing',
    );
  }

  return {
    success: true,
    value: binding_value,
  };
}

/**
 * @param {ParserState} parser_state
 * @param {RegExp} pattern
 * @returns {string | null}
 */
function readMatch(parser_state, pattern) {
  const match = parser_state.where_clause
    .slice(parser_state.index)
    .match(pattern);

  if (!match) {
    return null;
  }

  parser_state.index += match[0].length;
  return match[0];
}

/**
 * @param {ParserState} parser_state
 * @param {string} operator
 * @returns {boolean}
 */
function consumeOperator(parser_state, operator) {
  skipWhitespace(parser_state);

  if (!parser_state.where_clause.startsWith(operator, parser_state.index)) {
    return false;
  }

  parser_state.index += operator.length;
  return true;
}

/**
 * @param {ParserState} parser_state
 * @param {string} keyword
 * @returns {boolean}
 */
function consumeKeyword(parser_state, keyword) {
  if (!parser_state.where_clause.startsWith(keyword, parser_state.index)) {
    return false;
  }

  const next_character =
    parser_state.where_clause[parser_state.index + keyword.length];

  if (next_character && /[a-z_]/u.test(next_character)) {
    return false;
  }

  parser_state.index += keyword.length;
  return true;
}

/**
 * @param {ParserState} parser_state
 * @returns {boolean}
 */
function consumeRequiredWhitespace(parser_state) {
  return skipWhitespace(parser_state) > 0;
}

/**
 * @param {ParserState} parser_state
 * @returns {number}
 */
function skipWhitespace(parser_state) {
  const whitespace = readMatch(parser_state, /^\s+/u);
  return whitespace?.length ?? 0;
}

/**
 * @param {ParserState} parser_state
 * @returns {string | undefined}
 */
function currentCharacter(parser_state) {
  return parser_state.where_clause[parser_state.index];
}

/**
 * @param {ParserState} parser_state
 * @returns {boolean}
 */
function isAtEnd(parser_state) {
  return parser_state.index >= parser_state.where_clause.length;
}

/**
 * @param {ParsedExpression} expression
 * @returns {ParseExpressionResult}
 */
function successExpression(expression) {
  return { expression, success: true };
}

/**
 * @param {ParsedTerm} term
 * @returns {ParseTermResult}
 */
function successTerm(term) {
  return { success: true, term };
}

/**
 * @param {ParserState} parser_state
 * @returns {{ diagnostic: PatramDiagnostic, success: false }}
 */
function failToken(parser_state) {
  return fail(
    parser_state.index + 1,
    `Unsupported query token "${readToken(parser_state, parser_state.index)}".`,
  );
}

/**
 * @param {ParserState} parser_state
 * @returns {{ diagnostic: PatramDiagnostic, success: false }}
 */
function failExpectedTerm(parser_state) {
  return fail(
    isAtEnd(parser_state)
      ? parser_state.where_clause.length + 1
      : parser_state.index + 1,
    'Expected a query term.',
  );
}

/**
 * @param {number} column
 * @param {string} message
 * @param {string} code
 * @returns {{ diagnostic: PatramDiagnostic, success: false }}
 */
function fail(column, message, code = 'query.invalid') {
  return {
    diagnostic: {
      code,
      column,
      level: 'error',
      line: 1,
      message,
      path: '<query>',
    },
    success: false,
  };
}

/**
 * @param {ParserState} parser_state
 * @param {number} start_index
 * @returns {string}
 */
function readToken(parser_state, start_index) {
  return parser_state.where_clause.slice(start_index).match(/^\S+/u)?.[0] ?? '';
}
