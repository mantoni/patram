/** @import * as $k$$k$$l$$k$$k$$l$config$l$load$j$patram$j$config$k$types$k$ts from '../../config/load-patram-config.types.ts'; */
/**
 * @import { CypherParserState, CypherToken } from './cypher.types.ts';
 */

import { fail } from './cypher-support.js';

/**
 * @param {CypherParserState} parser_state
 * @param {string} message
 * @returns {{diagnostic: $k$$k$$l$$k$$k$$l$config$l$load$j$patram$j$config$k$types$k$ts.PatramDiagnostic, success: false}}
 */
export function failAtCurrent(parser_state, message) {
  const token = peekToken(parser_state);

  return fail(
    token ? token.column : parser_state.query_text.length + 1,
    message,
  );
}

/**
 * @param {CypherParserState} parser_state
 * @param {string} keyword
 * @returns {CypherToken}
 */
export function expectKeyword(parser_state, keyword) {
  const token = consumeToken(parser_state);

  if (!isKeywordToken(token, keyword)) {
    throw new Error(`Expected the ${keyword} keyword.`);
  }

  return /** @type {CypherToken} */ (token);
}

/**
 * @param {CypherParserState} parser_state
 * @param {string} symbol
 * @returns {CypherToken}
 */
export function expectSymbol(parser_state, symbol) {
  const token = consumeToken(parser_state);

  if (!isSymbolToken(token, symbol)) {
    throw new Error(`Expected the "${symbol}" token.`);
  }

  return /** @type {CypherToken} */ (token);
}

/**
 * @param {CypherParserState} parser_state
 * @param {string} keyword
 * @returns {boolean}
 */
export function consumeKeyword(parser_state, keyword) {
  const token = peekToken(parser_state);

  if (!isKeywordToken(token, keyword)) {
    return false;
  }

  parser_state.index += 1;
  return true;
}

/**
 * @param {CypherParserState} parser_state
 * @param {string} symbol
 * @returns {boolean}
 */
export function consumeSymbol(parser_state, symbol) {
  const token = peekToken(parser_state);

  if (!isSymbolToken(token, symbol)) {
    return false;
  }

  parser_state.index += 1;
  return true;
}

/**
 * @param {CypherParserState} parser_state
 * @param {string} keyword
 * @returns {boolean}
 */
export function peekKeyword(parser_state, keyword) {
  return isKeywordToken(peekToken(parser_state), keyword);
}

/**
 * @param {CypherParserState} parser_state
 * @param {number} offset
 * @param {string} symbol
 * @returns {boolean}
 */
export function peekSymbolAt(parser_state, offset, symbol) {
  return isSymbolToken(
    parser_state.tokens[parser_state.index + offset],
    symbol,
  );
}

/**
 * @param {CypherParserState} parser_state
 * @returns {CypherToken | undefined}
 */
export function consumeToken(parser_state) {
  const token = parser_state.tokens[parser_state.index];

  if (token === undefined) {
    return undefined;
  }

  parser_state.index += 1;
  return token;
}

/**
 * @param {CypherParserState} parser_state
 * @returns {CypherToken | undefined}
 */
export function peekToken(parser_state) {
  return parser_state.tokens[parser_state.index];
}

/**
 * @param {CypherToken | undefined} token
 * @param {string} keyword
 * @returns {boolean}
 */
function isKeywordToken(token, keyword) {
  return (
    token !== undefined &&
    token.kind === 'identifier' &&
    token.value.toUpperCase() === keyword
  );
}

/**
 * @param {CypherToken | undefined} token
 * @param {string} symbol
 * @returns {boolean}
 */
function isSymbolToken(token, symbol) {
  return (
    token !== undefined && token.kind === 'symbol' && token.value === symbol
  );
}
