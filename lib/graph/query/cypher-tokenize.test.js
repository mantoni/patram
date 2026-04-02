import { expect, it } from 'vitest';

import { tokenizeCypher } from './cypher-tokenize.js';

it('tokenizes supported cypher input', () => {
  const tokenize_result = tokenizeCypher(
    "MATCH (n:Task) WHERE n.status <> 'rea\\'dy' AND COUNT { MATCH (n)-[:TRACKED_IN]->(task) } >= 2 RETURN n",
  );

  expect(tokenize_result.success).toBe(true);

  if (!tokenize_result.success) {
    return;
  }

  expect(tokenize_result.tokens.map((token) => token.value)).toEqual([
    'MATCH',
    '(',
    'n',
    ':',
    'Task',
    ')',
    'WHERE',
    'n',
    '.',
    'status',
    '<>',
    "rea'dy",
    'AND',
    'COUNT',
    '{',
    'MATCH',
    '(',
    'n',
    ')',
    '-',
    '[',
    ':',
    'TRACKED_IN',
    ']',
    '->',
    '(',
    'task',
    ')',
    '}',
    '>=',
    '2',
    'RETURN',
    'n',
  ]);
});

it('reports invalid cypher tokens', () => {
  expect(tokenizeCypher('MATCH (n) RETURN n;')).toEqual({
    diagnostic: {
      code: 'query.invalid',
      column: 19,
      level: 'error',
      line: 1,
      message: 'Unsupported query token ";".',
      path: '<query>',
    },
    success: false,
  });
});

it('reports unterminated string literals', () => {
  expect(tokenizeCypher("MATCH (n) WHERE n.title = 'unterminated")).toEqual({
    diagnostic: {
      code: 'query.invalid',
      column: 27,
      level: 'error',
      line: 1,
      message: 'Unterminated string literal.',
      path: '<query>',
    },
    success: false,
  });
});
