/* eslint-disable max-lines-per-function */
import { expect, it } from 'vitest';

import { parseWhereClause } from './parse-where-clause.js';

it('parses structural fields and declared metadata fields', () => {
  expect(
    parseWhereClause(
      '$class=task and $path^=docs/tasks/ and owner in [max, emma]',
    ),
  ).toMatchObject({
    expression: {
      expressions: [
        {
          kind: 'term',
          term: {
            field_name: '$class',
            kind: 'field',
            operator: '=',
            value: 'task',
          },
        },
        {
          kind: 'term',
          term: {
            field_name: '$path',
            kind: 'field',
            operator: '^=',
            value: 'docs/tasks/',
          },
        },
        {
          kind: 'term',
          term: {
            field_name: 'owner',
            kind: 'field_set',
            operator: 'in',
            values: ['max', 'emma'],
          },
        },
      ],
      kind: 'and',
    },
    success: true,
  });
});

it('parses a typed comparison term for metadata fields', () => {
  expect(parseWhereClause('priority >= 2')).toMatchObject({
    expression: {
      kind: 'term',
      term: {
        field_name: 'priority',
        kind: 'field',
        operator: '>=',
        value: '2',
      },
    },
    success: true,
  });
});

it('parses a set-membership term', () => {
  expect(parseWhereClause('status not in [done, dropped, superseded]')).toEqual(
    {
      expression: {
        kind: 'term',
        term: {
          column: 1,
          field_name: 'status',
          kind: 'field_set',
          operator: 'not in',
          values: ['done', 'dropped', 'superseded'],
        },
      },
      success: true,
    },
  );
});

it('parses an exact relation-target term', () => {
  expect(parseWhereClause('implements_command=command:query')).toEqual({
    expression: {
      kind: 'term',
      term: {
        column: 1,
        kind: 'relation_target',
        relation_name: 'implements_command',
        target_id: 'command:query',
      },
    },
    success: true,
  });
});

it('parses a traversal aggregate clause with a nested subquery', () => {
  expect(
    parseWhereClause(
      'none(in:decided_by, $class=task and status not in [done, dropped, superseded])',
    ),
  ).toEqual({
    expression: {
      kind: 'term',
      term: {
        aggregate_name: 'none',
        expression: {
          expressions: [
            {
              kind: 'term',
              term: {
                column: 21,
                field_name: '$class',
                kind: 'field',
                operator: '=',
                value: 'task',
              },
            },
            {
              kind: 'term',
              term: {
                column: 37,
                field_name: 'status',
                kind: 'field_set',
                operator: 'not in',
                values: ['done', 'dropped', 'superseded'],
              },
            },
          ],
          kind: 'and',
        },
        kind: 'aggregate',
        traversal: {
          column: 6,
          direction: 'in',
          relation_name: 'decided_by',
        },
      },
    },
    success: true,
  });
});

it('parses `or` with lower precedence than `and`', () => {
  expect(
    parseWhereClause('$class=task or status=done and title~Show'),
  ).toMatchObject({
    expression: {
      expressions: [
        {
          kind: 'term',
          term: {
            field_name: '$class',
            kind: 'field',
            operator: '=',
            value: 'task',
          },
        },
        {
          expressions: [
            {
              kind: 'term',
              term: {
                field_name: 'status',
                kind: 'field',
                operator: '=',
                value: 'done',
              },
            },
            {
              kind: 'term',
              term: {
                field_name: 'title',
                kind: 'field',
                operator: '~',
                value: 'Show',
              },
            },
          ],
          kind: 'and',
        },
      ],
      kind: 'or',
    },
    success: true,
  });
});

it('parses a count aggregate with a comparison', () => {
  expect(parseWhereClause('count(in:decided_by, $class=task) = 0')).toEqual({
    expression: {
      kind: 'term',
      term: {
        aggregate_name: 'count',
        expression: {
          kind: 'term',
          term: {
            column: 22,
            field_name: '$class',
            kind: 'field',
            operator: '=',
            value: 'task',
          },
        },
        comparison: '=',
        kind: 'aggregate',
        traversal: {
          column: 7,
          direction: 'in',
          relation_name: 'decided_by',
        },
        value: 0,
      },
    },
    success: true,
  });
});

it('parses parenthesized groups and `not` over a group', () => {
  expect(parseWhereClause('not ($class=task or uses_term=term:graph)')).toEqual(
    {
      expression: {
        expression: {
          expressions: [
            {
              kind: 'term',
              term: {
                column: 6,
                field_name: '$class',
                kind: 'field',
                operator: '=',
                value: 'task',
              },
            },
            {
              kind: 'term',
              term: {
                column: 21,
                kind: 'relation_target',
                relation_name: 'uses_term',
                target_id: 'term:graph',
              },
            },
          ],
          kind: 'or',
        },
        kind: 'not',
      },
      success: true,
    },
  );
});

it('parses a negated exact relation-target term without grouping', () => {
  expect(parseWhereClause('not uses_term=term:graph')).toEqual({
    expression: {
      expression: {
        kind: 'term',
        term: {
          column: 5,
          kind: 'relation_target',
          relation_name: 'uses_term',
          target_id: 'term:graph',
        },
      },
      kind: 'not',
    },
    success: true,
  });
});

it('parses count aggregates with ordered comparisons', () => {
  expect(parseWhereClause('count(in:decided_by, $class=task) >= 10')).toEqual({
    expression: {
      kind: 'term',
      term: {
        aggregate_name: 'count',
        expression: {
          kind: 'term',
          term: {
            column: 22,
            field_name: '$class',
            kind: 'field',
            operator: '=',
            value: 'task',
          },
        },
        comparison: '>=',
        kind: 'aggregate',
        traversal: {
          column: 7,
          direction: 'in',
          relation_name: 'decided_by',
        },
        value: 10,
      },
    },
    success: true,
  });
});

it('reports invalid grouping, count, and list syntax', () => {
  expect(parseWhereClause('($class=task')).toEqual({
    diagnostic: {
      code: 'query.invalid',
      column: 13,
      level: 'error',
      line: 1,
      message: 'Unsupported query token "".',
      path: '<query>',
    },
    success: false,
  });

  expect(parseWhereClause('count(in:decided_by, $class=task)')).toEqual({
    diagnostic: {
      code: 'query.invalid',
      column: 34,
      level: 'error',
      line: 1,
      message: 'Unsupported query token "".',
      path: '<query>',
    },
    success: false,
  });

  expect(parseWhereClause('status in []')).toEqual({
    diagnostic: {
      code: 'query.invalid',
      column: 13,
      level: 'error',
      line: 1,
      message: 'Unsupported query token "".',
      path: '<query>',
    },
    success: false,
  });

  expect(parseWhereClause('status in [done,,dropped]')).toEqual({
    diagnostic: {
      code: 'query.invalid',
      column: 17,
      level: 'error',
      line: 1,
      message: 'Unsupported query token ",dropped]".',
      path: '<query>',
    },
    success: false,
  });
});

it('reports unsupported trailing tokens and malformed `not` prefixes', () => {
  expect(parseWhereClause('$class=task ???')).toEqual({
    diagnostic: {
      code: 'query.invalid',
      column: 13,
      level: 'error',
      line: 1,
      message: 'Unsupported query token "???".',
      path: '<query>',
    },
    success: false,
  });

  expect(parseWhereClause('not$class=task')).toEqual({
    diagnostic: {
      code: 'query.invalid',
      column: 1,
      level: 'error',
      line: 1,
      message: 'Unsupported query token "not$class=task".',
      path: '<query>',
    },
    success: false,
  });
});
