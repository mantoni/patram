import { expect, it } from 'vitest';

import { parseQueryExpression } from './parse-query.js';

it('falls back to the legacy where parser for non-cypher input', () => {
  expect(parseQueryExpression('status=ready', null)).toEqual({
    diagnostic: {
      code: 'query.invalid',
      column: 7,
      level: 'error',
      line: 1,
      message: 'Expected the MATCH keyword.',
      path: '<query>',
    },
    success: false,
  });
});

it('parses supported cypher queries', () => {
  expect(parseQueryExpression('MATCH (n:Task) RETURN n', null)).toEqual({
    expression: {
      kind: 'term',
      term: {
        column: 7,
        field_name: '$class',
        kind: 'field',
        operator: '=',
        value: 'task',
      },
    },
    success: true,
  });
});

it('preserves cypher field inequality operators in parsed expressions', () => {
  expect(
    parseQueryExpression("MATCH (n) WHERE n.status <> 'ready' RETURN n", null),
  ).toEqual({
    expression: {
      kind: 'term',
      term: {
        column: 19,
        field_name: 'status',
        kind: 'field',
        operator: '<>',
        value: 'ready',
      },
    },
    success: true,
  });
});

it('preserves cypher aggregate inequality operators in parsed expressions', () => {
  expect(
    parseQueryExpression(
      'MATCH (n) WHERE COUNT { MATCH (task)-[:TRACKED_IN]->(n) } <> 0 RETURN n',
      null,
    ),
  ).toEqual({
    expression: {
      kind: 'term',
      term: {
        aggregate_name: 'count',
        comparison: '<>',
        expression: {
          kind: 'term',
          term: {
            column: 17,
            field_name: '$id',
            kind: 'field',
            operator: '^=',
            value: '',
          },
        },
        kind: 'aggregate',
        traversal: {
          column: 37,
          direction: 'in',
          relation_name: 'tracked_in',
        },
        value: 0,
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

it('reports end-of-input parser failures at the query boundary', () => {
  expect(parseQueryExpression('MATCH', null)).toEqual({
    diagnostic: {
      code: 'query.invalid',
      column: 6,
      level: 'error',
      line: 1,
      message: 'Expected the "(" token.',
      path: '<query>',
    },
    success: false,
  });
});

it('reports non-throw parser failures directly', () => {
  expect(parseQueryExpression('MATCH (:Task) RETURN n', null)).toEqual({
    diagnostic: {
      code: 'query.invalid',
      column: 15,
      level: 'error',
      line: 1,
      message: 'Cypher root MATCH requires a variable.',
      path: '<query>',
    },
    success: false,
  });
});

it('uses local parser diagnostics when the cypher parser throws', () => {
  expect(parseQueryExpression('MATCH (n RETURN n', null)).toEqual({
    diagnostic: {
      code: 'query.invalid',
      column: 10,
      level: 'error',
      line: 1,
      message: 'Unexpected token while parsing a node pattern.',
      path: '<query>',
    },
    success: false,
  });
});

it('reports the parser error message when no structured failure is returned', () => {
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
