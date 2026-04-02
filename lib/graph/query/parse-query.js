/**
 * @import { PatramRepoConfig } from '../../config/load-patram-config.types.ts';
 * @import { ParseWhereClauseResult } from '../parse-where-clause.types.ts';
 * @import { CypherParserState } from './cypher.types.ts';
 */

import { parseWhereClause } from './parse.js';
import { looksLikeCypher } from './cypher-support.js';
import { tokenizeCypher } from './cypher-tokenize.js';
import { parseCypherExpression } from './parse-cypher.js';

/**
 * Parse one query string as either the legacy where-clause language or the
 * constrained Cypher subset.
 *
 * @param {string} query_text
 * @param {PatramRepoConfig | null} repo_config
 * @param {{ bindings?: Record<string, string> }=} options
 * @returns {ParseWhereClauseResult}
 */
export function parseQueryExpression(query_text, repo_config, options = {}) {
  if (!looksLikeCypher(query_text)) {
    return parseWhereClause(query_text, options);
  }

  const tokenize_result = tokenizeCypher(query_text);

  if (!tokenize_result.success) {
    return tokenize_result;
  }

  /** @type {CypherParserState} */
  const parser_state = {
    index: 0,
    query_text,
    repo_config,
    root_variable_name: null,
    tokens: tokenize_result.tokens,
  };

  try {
    const expression_result = parseCypherExpression(parser_state);

    if (!expression_result.success) {
      return expression_result;
    }

    return resolveTrailingTokens(parser_state, expression_result);
  } catch (error) {
    return resolveCypherSyntaxError(query_text, parser_state, error);
  }
}

/**
 * @param {CypherParserState} parser_state
 * @param {ParseWhereClauseResult & { success: true }} expression_result
 * @returns {ParseWhereClauseResult}
 */
function resolveTrailingTokens(parser_state, expression_result) {
  if (parser_state.index >= parser_state.tokens.length) {
    return expression_result;
  }

  const token = parser_state.tokens[parser_state.index];

  return {
    diagnostic: {
      code: 'query.invalid',
      column: token.column,
      level: 'error',
      line: 1,
      message: `Unsupported query token "${token.value}".`,
      path: '<query>',
    },
    success: false,
  };
}

/**
 * @param {string} query_text
 * @param {CypherParserState} parser_state
 * @param {unknown} error
 * @returns {ParseWhereClauseResult}
 */
function resolveCypherSyntaxError(query_text, parser_state, error) {
  if (!(error instanceof Error)) {
    throw error;
  }

  return {
    diagnostic: {
      code: 'query.invalid',
      column:
        parser_state.tokens[parser_state.index]?.column ??
        query_text.length + 1,
      level: 'error',
      line: 1,
      message: error.message,
      path: '<query>',
    },
    success: false,
  };
}
