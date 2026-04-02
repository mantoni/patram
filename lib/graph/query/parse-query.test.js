import { expect, it } from 'vitest';

import { parseQueryExpression } from './parse-query.js';

it('falls back to the legacy where parser for non-cypher input', () => {
  expect(parseQueryExpression('status=ready', null)).toEqual({
    expression: {
      kind: 'term',
      term: {
        column: 1,
        field_name: 'status',
        kind: 'field',
        operator: '=',
        value: 'ready',
      },
    },
    success: true,
  });
});

it('reports tokenization and trailing-token failures', () => {
  expect(parseQueryExpression('MATCH (n) RETURN n;', null)).toEqual({
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
  expect(parseQueryExpression('MATCH (n) RETURN n extra', null)).toEqual({
    diagnostic: {
      code: 'query.invalid',
      column: 20,
      level: 'error',
      line: 1,
      message: 'Unsupported query token "extra".',
      path: '<query>',
    },
    success: false,
  });
});

it('uses validateSyntax diagnostics when the cypher parser throws', () => {
  expect(parseQueryExpression('MATCH (n RETURN n', null)).toEqual({
    diagnostic: {
      code: 'query.invalid',
      column: 10,
      level: 'error',
      line: 1,
      message: "Expected any of '=', ')', '{', ':', IS, WHERE or a parameter",
      path: '<query>',
    },
    success: false,
  });
});

it('falls back to the parser error message when validateSyntax has no diagnostics', () => {
  expect(parseQueryExpression('MATCH (n) WHERE EXISTS RETURN n', null)).toEqual(
    {
      diagnostic: {
        code: 'query.invalid',
        column: 31,
        level: 'error',
        line: 1,
        message: 'Expected the "{" token.',
        path: '<query>',
      },
      success: false,
    },
  );
});
