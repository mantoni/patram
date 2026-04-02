/**
 * @import { CypherParserState } from './cypher.types.ts';
 */

import { expect, it } from 'vitest';

import {
  consumeKeyword,
  consumeSymbol,
  consumeToken,
  expectKeyword,
  expectSymbol,
  failAtCurrent,
  peekKeyword,
  peekSymbolAt,
  peekToken,
} from './cypher-reader.js';
import { tokenizeCypher } from './cypher-tokenize.js';

it('reads tokens from cypher parser state', () => {
  const parser_state = createParserState('MATCH (n)');

  expect(peekKeyword(parser_state, 'MATCH')).toBe(true);
  expect(expectKeyword(parser_state, 'MATCH').value).toBe('MATCH');
  expect(consumeSymbol(parser_state, '(')).toBe(true);
  expect(peekSymbolAt(parser_state, 1, ')')).toBe(true);
  expect(consumeKeyword(parser_state, 'WHERE')).toBe(false);
  expect(consumeToken(parser_state)?.value).toBe('n');
  expect(expectSymbol(parser_state, ')').value).toBe(')');
  expect(consumeToken(parser_state)).toBeUndefined();
  expect(peekToken(parser_state)).toBeUndefined();
  expect(failAtCurrent(parser_state, 'Expected more.')).toEqual({
    diagnostic: {
      code: 'query.invalid',
      column: 'MATCH (n)'.length + 1,
      level: 'error',
      line: 1,
      message: 'Expected more.',
      path: '<query>',
    },
    success: false,
  });
});

it('reports reader failures at the current token', () => {
  const parser_state = createParserState('MATCH (n)');

  expect(() => expectKeyword(parser_state, 'WHERE')).toThrow(
    'Expected the WHERE keyword.',
  );
  expect(() => expectSymbol(parser_state, '{')).toThrow(
    'Expected the "{" token.',
  );
  expect(failAtCurrent(parser_state, 'Bad token.')).toEqual({
    diagnostic: {
      code: 'query.invalid',
      column: 8,
      level: 'error',
      line: 1,
      message: 'Bad token.',
      path: '<query>',
    },
    success: false,
  });
});

/**
 * @param {string} query_text
 * @returns {CypherParserState}
 */
function createParserState(query_text) {
  const tokenize_result = tokenizeCypher(query_text);

  if (!tokenize_result.success) {
    throw new Error('Expected tokenization to succeed.');
  }

  return {
    bindings: {},
    index: 0,
    query_text,
    repo_config: null,
    root_variable_name: null,
    tokens: tokenize_result.tokens,
  };
}
