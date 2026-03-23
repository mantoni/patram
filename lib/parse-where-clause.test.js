import { expect, it } from 'vitest';

import { parseWhereClause } from './parse-where-clause.js';

it('parses a set-membership term', () => {
  expect(parseWhereClause('status not in [done, dropped, superseded]')).toEqual(
    {
      clauses: [
        {
          is_negated: false,
          term: {
            field_name: 'status',
            kind: 'field_set',
            operator: 'not in',
            values: ['done', 'dropped', 'superseded'],
          },
        },
      ],
      success: true,
    },
  );
});

it('parses an exact relation-target term', () => {
  expect(parseWhereClause('implements_command=command:query')).toEqual({
    clauses: [
      {
        is_negated: false,
        term: {
          column: 1,
          kind: 'relation_target',
          relation_name: 'implements_command',
          target_id: 'command:query',
        },
      },
    ],
    success: true,
  });
});

it('parses a traversal aggregate clause with a nested subquery', () => {
  expect(
    parseWhereClause(
      'none(in:decided_by, kind=task and status not in [done, dropped, superseded])',
    ),
  ).toEqual({
    clauses: [
      {
        is_negated: false,
        term: {
          aggregate_name: 'none',
          clauses: [
            {
              is_negated: false,
              term: {
                field_name: 'kind',
                kind: 'field',
                operator: '=',
                value: 'task',
              },
            },
            {
              is_negated: false,
              term: {
                field_name: 'status',
                kind: 'field_set',
                operator: 'not in',
                values: ['done', 'dropped', 'superseded'],
              },
            },
          ],
          kind: 'aggregate',
          traversal: {
            column: 6,
            direction: 'in',
            relation_name: 'decided_by',
          },
        },
      },
    ],
    success: true,
  });
});

it('parses a count aggregate with a comparison', () => {
  expect(parseWhereClause('count(in:decided_by, kind=task) = 0')).toEqual({
    clauses: [
      {
        is_negated: false,
        term: {
          aggregate_name: 'count',
          clauses: [
            {
              is_negated: false,
              term: {
                field_name: 'kind',
                kind: 'field',
                operator: '=',
                value: 'task',
              },
            },
          ],
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
    ],
    success: true,
  });
});

it('parses a negated exact relation-target term', () => {
  expect(parseWhereClause('not uses_term=term:graph')).toEqual({
    clauses: [
      {
        is_negated: true,
        term: {
          column: 5,
          kind: 'relation_target',
          relation_name: 'uses_term',
          target_id: 'term:graph',
        },
      },
    ],
    success: true,
  });
});
