/**
 * @import { PatramDiagnostic } from '../../config/load-patram-config.types.ts';
 * @import { CypherToken } from './cypher.types.ts';
 */

import { fail } from './cypher-support.js';

const DOUBLE_CHAR_SYMBOLS = ['->', '<-', '<=', '>=', '<>'];
const SINGLE_CHAR_SYMBOLS = '(){}[]:,.=-<>@';
const IDENTIFIER_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*/u;
const NUMBER_PATTERN = /^\d+/u;

/**
 * @param {string} query_text
 * @returns {{ success: true, tokens: CypherToken[] } | { diagnostic: PatramDiagnostic, success: false }}
 */
export function tokenizeCypher(query_text) {
  /** @type {CypherToken[]} */
  const tokens = [];
  let index = 0;

  while (index < query_text.length) {
    const char = query_text[index];

    if (/\s/u.test(char)) {
      index += 1;
      continue;
    }

    const column = index + 1;
    const string_result = readStringToken(query_text, index, column);

    if (string_result) {
      if (!string_result.success) {
        return string_result;
      }

      tokens.push(string_result.token);
      index = string_result.next_index;
      continue;
    }

    const simple_token = readSimpleToken(query_text, index, column);

    if (simple_token) {
      tokens.push(simple_token.token);
      index = simple_token.next_index;
      continue;
    }

    return fail(column, `Unsupported query token "${char}".`);
  }

  return {
    success: true,
    tokens,
  };
}

/**
 * @param {string} query_text
 * @param {number} start_index
 * @param {number} column
 * @returns {{ success: true, next_index: number, token: CypherToken } | { diagnostic: PatramDiagnostic, success: false } | null}
 */
function readStringToken(query_text, start_index, column) {
  const quote = query_text[start_index];

  if (quote !== "'" && quote !== '"') {
    return null;
  }

  const string_result = readQuotedString(query_text, start_index);

  if (!string_result.success) {
    return string_result;
  }

  return {
    next_index: string_result.next_index,
    success: true,
    token: {
      column,
      index: start_index,
      kind: 'string',
      value: string_result.value,
    },
  };
}

/**
 * @param {string} query_text
 * @param {number} start_index
 * @param {number} column
 * @returns {{ next_index: number, token: CypherToken } | null}
 */
function readSimpleToken(query_text, start_index, column) {
  return (
    readDoubleCharSymbol(query_text, start_index, column) ??
    readSingleCharSymbol(query_text, start_index, column) ??
    readPatternToken(
      query_text,
      start_index,
      column,
      NUMBER_PATTERN,
      'number',
    ) ??
    readPatternToken(
      query_text,
      start_index,
      column,
      IDENTIFIER_PATTERN,
      'identifier',
    )
  );
}

/**
 * @param {string} query_text
 * @param {number} start_index
 * @param {number} column
 * @returns {{ next_index: number, token: CypherToken } | null}
 */
function readDoubleCharSymbol(query_text, start_index, column) {
  const value = query_text.slice(start_index, start_index + 2);

  if (!DOUBLE_CHAR_SYMBOLS.includes(value)) {
    return null;
  }

  return createTokenResult(start_index, column, 'symbol', value);
}

/**
 * @param {string} query_text
 * @param {number} start_index
 * @param {number} column
 * @returns {{ next_index: number, token: CypherToken } | null}
 */
function readSingleCharSymbol(query_text, start_index, column) {
  const value = query_text[start_index];

  if (!SINGLE_CHAR_SYMBOLS.includes(value)) {
    return null;
  }

  return createTokenResult(start_index, column, 'symbol', value);
}

/**
 * @param {string} query_text
 * @param {number} start_index
 * @param {number} column
 * @param {RegExp} pattern
 * @param {'identifier' | 'number'} kind
 * @returns {{ next_index: number, token: CypherToken } | null}
 */
function readPatternToken(query_text, start_index, column, pattern, kind) {
  const match = query_text.slice(start_index).match(pattern);

  if (!match) {
    return null;
  }

  return createTokenResult(start_index, column, kind, match[0]);
}

/**
 * @param {number} index
 * @param {number} column
 * @param {CypherToken['kind']} kind
 * @param {string} value
 * @returns {{ next_index: number, token: CypherToken }}
 */
function createTokenResult(index, column, kind, value) {
  return {
    next_index: index + value.length,
    token: {
      column,
      index,
      kind,
      value,
    },
  };
}

/**
 * @param {string} query_text
 * @param {number} start_index
 * @returns {{ success: true, next_index: number, value: string } | { diagnostic: PatramDiagnostic, success: false }}
 */
function readQuotedString(query_text, start_index) {
  const quote = query_text[start_index];
  let index = start_index + 1;
  let value = '';

  while (index < query_text.length) {
    const char = query_text[index];

    if (char === '\\') {
      const escaped_char = query_text[index + 1];

      if (escaped_char === undefined) {
        break;
      }

      value += escaped_char;
      index += 2;
      continue;
    }

    if (char === quote) {
      return {
        next_index: index + 1,
        success: true,
        value,
      };
    }

    value += char;
    index += 1;
  }

  return fail(start_index + 1, 'Unterminated string literal.');
}
