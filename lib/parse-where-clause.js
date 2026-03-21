/**
 * @import { PatramDiagnostic } from './load-patram-config.types.ts';
 */

/**
 * @typedef {{
 *   field_name: 'id' | 'kind' | 'path' | 'status' | 'title',
 *   kind: 'field',
 *   operator: '=' | '^=' | '~',
 *   value: string,
 * }} ParsedFieldTerm
 */

/**
 * @typedef {{
 *   kind: 'relation',
 *   relation_name: string,
 * }} ParsedRelationTerm
 */

/**
 * @typedef {{
 *   is_negated: boolean,
 *   term: ParsedFieldTerm | ParsedRelationTerm,
 * }} ParsedClause
 */

/**
 * @typedef {{
 *   clause: ParsedClause,
 *   success: true,
 * } | {
 *   diagnostic: PatramDiagnostic,
 *   success: false,
 * }} CreateClauseResult
 */

/**
 * @typedef {{
 *   clauses: ParsedClause[],
 *   success: true,
 * } | {
 *   diagnostic: PatramDiagnostic,
 *   success: false,
 * }} ParseWhereClauseResult
 */

/**
 * Parse one v0 where clause into structured clauses.
 *
 * @param {string} where_clause
 * @returns {ParseWhereClauseResult}
 */
export function parseWhereClause(where_clause) {
  const tokens = tokenizeWhereClause(where_clause);

  if (tokens.length === 0) {
    return {
      diagnostic: createQueryDiagnostic(1, 'Query must not be empty.'),
      success: false,
    };
  }

  return parseTokens(tokens, where_clause);
}

/**
 * @param {{ value: string, column: number }[]} tokens
 * @param {string} where_clause
 * @returns {ParseWhereClauseResult}
 */
function parseTokens(tokens, where_clause) {
  /** @type {ParsedClause[]} */
  const clauses = [];
  let should_expect_term = true;
  let is_negated = false;

  for (const token of tokens) {
    if (token.value === 'and') {
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
      continue;
    }

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

    const clause_result = createClause(token, is_negated);

    if (!clause_result.success) {
      return clause_result;
    }

    clauses.push(clause_result.clause);
    is_negated = false;
    should_expect_term = false;
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

  return {
    clauses,
    success: true,
  };
}

/**
 * @param {{ value: string, column: number }} token
 * @param {boolean} is_negated
 * @returns {CreateClauseResult}
 */
function createClause(token, is_negated) {
  const field_term = createFieldTerm(token.value);

  if (field_term) {
    return {
      clause: {
        is_negated,
        term: field_term,
      },
      success: true,
    };
  }

  if (/^[a-z_]+:\*$/u.test(token.value)) {
    return {
      clause: {
        is_negated,
        term: {
          kind: 'relation',
          relation_name: token.value.slice(0, -2),
        },
      },
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
 * @param {string} query_term
 * @returns {ParsedFieldTerm | null}
 */
function createFieldTerm(query_term) {
  if (query_term.startsWith('id=')) {
    return {
      field_name: 'id',
      kind: 'field',
      operator: '=',
      value: query_term.slice('id='.length),
    };
  }

  if (query_term.startsWith('id^=')) {
    return {
      field_name: 'id',
      kind: 'field',
      operator: '^=',
      value: query_term.slice('id^='.length),
    };
  }

  if (query_term.startsWith('kind=')) {
    return {
      field_name: 'kind',
      kind: 'field',
      operator: '=',
      value: query_term.slice('kind='.length),
    };
  }

  if (query_term.startsWith('status=')) {
    return {
      field_name: 'status',
      kind: 'field',
      operator: '=',
      value: query_term.slice('status='.length),
    };
  }

  if (query_term.startsWith('path=')) {
    return {
      field_name: 'path',
      kind: 'field',
      operator: '=',
      value: query_term.slice('path='.length),
    };
  }

  if (query_term.startsWith('path^=')) {
    return {
      field_name: 'path',
      kind: 'field',
      operator: '^=',
      value: query_term.slice('path^='.length),
    };
  }

  if (query_term.startsWith('title~')) {
    return {
      field_name: 'title',
      kind: 'field',
      operator: '~',
      value: query_term.slice('title~'.length),
    };
  }

  return null;
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
