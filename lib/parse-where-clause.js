/* eslint-disable max-lines */
/**
 * @import { PatramDiagnostic } from './load-patram-config.types.ts';
 * @import {
 *   ParseWhereClauseResult,
 *   ParsedAggregateComparison,
 *   ParsedAggregateName,
 *   ParsedAggregateTerm,
 *   ParsedClause,
 *   ParsedFieldName,
 *   ParsedTerm,
 *   ParsedTraversalTerm,
 * } from './parse-where-clause.types.ts';
 */

/**
 * @typedef {{ index: number, where_clause: string }} ParserState
 */

/**
 * @typedef {{
 *   success: true,
 *   term: ParsedTerm,
 * } | {
 *   diagnostic: PatramDiagnostic,
 *   success: false,
 * }} ParseTermResult
 */

/**
 * Parse one where clause into structured clauses.
 *
 * @param {string} where_clause
 * @returns {ParseWhereClauseResult}
 */
export function parseWhereClause(where_clause) {
  /** @type {ParserState} */
  const parser_state = { index: 0, where_clause };

  skipWhitespace(parser_state);

  if (isAtEnd(parser_state)) {
    return fail(1, 'Query must not be empty.');
  }

  const clauses_result = parseClauses(parser_state, null);

  if (!clauses_result.success) {
    return clauses_result;
  }

  skipWhitespace(parser_state);

  if (!isAtEnd(parser_state)) {
    return failToken(parser_state);
  }

  return {
    clauses: clauses_result.clauses,
    success: true,
  };
}

/**
 * @param {ParserState} parser_state
 * @param {')' | null} stop_character
 * @returns {ParseWhereClauseResult}
 */
function parseClauses(parser_state, stop_character) {
  /** @type {ParsedClause[]} */
  const clauses = [];
  let is_first_clause = true;

  while (true) {
    skipWhitespace(parser_state);

    if (
      currentCharacter(parser_state) === stop_character ||
      isAtEnd(parser_state)
    ) {
      return is_first_clause
        ? fail(parser_state.where_clause.length + 1, 'Expected a query term.')
        : { clauses, success: true };
    }

    if (!is_first_clause) {
      if (!consumeKeyword(parser_state, 'and')) {
        return failToken(parser_state);
      }

      skipWhitespace(parser_state);

      if (
        currentCharacter(parser_state) === stop_character ||
        isAtEnd(parser_state)
      ) {
        return fail(
          parser_state.where_clause.length + 1,
          'Expected a query term.',
        );
      }
    }

    const clause_result = parseClause(parser_state);

    if (!clause_result.success) {
      return clause_result;
    }

    clauses.push(clause_result.clause);
    is_first_clause = false;
  }
}

/**
 * @param {ParserState} parser_state
 * @returns {{ clause: ParsedClause, success: true } | { diagnostic: PatramDiagnostic, success: false }}
 */
function parseClause(parser_state) {
  const clause_start = parser_state.index;
  const is_negated = consumeKeyword(parser_state, 'not');

  if (is_negated && !consumeRequiredWhitespace(parser_state)) {
    return fail(
      clause_start + 1,
      `Unsupported query token "${readToken(parser_state, clause_start)}".`,
    );
  }

  const term_result = parseTerm(parser_state);

  if (!term_result.success) {
    return term_result;
  }

  return {
    clause: {
      is_negated,
      term: term_result.term,
    },
    success: true,
  };
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
  const clauses_result = parseClauses(parser_state, ')');

  if (!clauses_result.success) {
    return clauses_result;
  }

  if (!consumeOperator(parser_state, ')')) {
    return failToken(parser_state);
  }

  return createAggregateTerm(
    parser_state,
    aggregate_name,
    traversal_result.traversal,
    clauses_result.clauses,
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

  return (
    parseFieldSet(parser_state, field_or_relation_name) ??
    parseOperatorTerm(parser_state, start_index, field_or_relation_name)
  );
}

/**
 * @param {ParserState} parser_state
 * @param {ParsedAggregateName} aggregate_name
 * @param {ParsedTraversalTerm} traversal
 * @param {ParsedClause[]} clauses
 * @returns {ParseTermResult}
 */
function createAggregateTerm(parser_state, aggregate_name, traversal, clauses) {
  /** @type {ParsedAggregateTerm} */
  const aggregate_term = {
    aggregate_name,
    clauses,
    kind: 'aggregate',
    traversal,
  };

  if (aggregate_name !== 'count') {
    return success(aggregate_term);
  }

  const count_tail = parseCountTail(parser_state);

  if (!count_tail) {
    return failToken(parser_state);
  }

  return success({
    ...aggregate_term,
    comparison: count_tail.comparison,
    value: count_tail.value,
  });
}

/**
 * @param {ParserState} parser_state
 * @param {ParsedFieldName | string} field_name
 * @returns {ParseTermResult | null}
 */
function parseFieldSet(parser_state, field_name) {
  if (!isSupportedFieldName(field_name)) {
    return null;
  }

  const start_index = parser_state.index;

  if (!consumeRequiredWhitespace(parser_state)) {
    return null;
  }

  const operator = parseSetOperator(parser_state);

  if (!operator) {
    parser_state.index = start_index;
    return null;
  }

  if (!consumeRequiredWhitespace(parser_state)) {
    return failToken(parser_state);
  }

  const values = parseList(parser_state);

  return values
    ? success({ field_name, kind: 'field_set', operator, values })
    : failToken(parser_state);
}

/**
 * @param {ParserState} parser_state
 * @param {number} start_index
 * @param {string} field_or_relation_name
 * @returns {ParseTermResult}
 */
function parseOperatorTerm(parser_state, start_index, field_or_relation_name) {
  const prefix_term = parsePrefixTerm(parser_state, field_or_relation_name);

  if (prefix_term) {
    return prefix_term;
  }

  const contains_term = parseContainsTerm(parser_state, field_or_relation_name);

  if (contains_term) {
    return contains_term;
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
    return success({
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
 * @param {string} field_name
 * @returns {ParseTermResult | null}
 */
function parsePrefixTerm(parser_state, field_name) {
  if (field_name !== 'id' && field_name !== 'path') {
    return null;
  }

  if (!consumeOperator(parser_state, '^=')) {
    return null;
  }

  const value = parseBareValue(parser_state);

  return value
    ? success({ field_name, kind: 'field', operator: '^=', value })
    : failToken(parser_state);
}

/**
 * @param {ParserState} parser_state
 * @param {string} field_name
 * @returns {ParseTermResult | null}
 */
function parseContainsTerm(parser_state, field_name) {
  if (field_name !== 'title' || !consumeOperator(parser_state, '~')) {
    return null;
  }

  const value = parseBareValue(parser_state);

  return value
    ? success({ field_name: 'title', kind: 'field', operator: '~', value })
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

  const value = parseBareValue(parser_state);

  if (!value) {
    return failToken(parser_state);
  }

  if (isExactMatchField(field_or_relation_name)) {
    return success({
      field_name: field_or_relation_name,
      kind: 'field',
      operator: '=',
      value,
    });
  }

  if (value.includes(':')) {
    return success({
      column: start_index + 1,
      kind: 'relation_target',
      relation_name: field_or_relation_name,
      target_id: value,
    });
  }

  parser_state.index = start_index;
  return failToken(parser_state);
}

/**
 * @param {ParserState} parser_state
 * @returns {string[] | null}
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

    const list_value = parseListValue(parser_state);

    if (!list_value) {
      return null;
    }

    values.push(list_value);
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
  return readMatch(parser_state, /^[a-z_]+/u);
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
 * @param {string} field_name
 * @returns {field_name is ParsedFieldName}
 */
function isSupportedFieldName(field_name) {
  return ['id', 'kind', 'path', 'status', 'title'].includes(field_name);
}

/**
 * @param {string} field_name
 * @returns {field_name is 'id' | 'kind' | 'path' | 'status'}
 */
function isExactMatchField(field_name) {
  return ['id', 'kind', 'path', 'status'].includes(field_name);
}

/**
 * @param {ParsedTerm} term
 * @returns {ParseTermResult}
 */
function success(term) {
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
 * @param {number} column
 * @param {string} message
 * @returns {{ diagnostic: PatramDiagnostic, success: false }}
 */
function fail(column, message) {
  return {
    diagnostic: {
      code: 'query.invalid',
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
