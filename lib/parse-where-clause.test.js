import { expect, it } from 'vitest';

import { parseWhereClause } from './parse-where-clause.js';

it('parses an exact relation-target term', () => {
  expect(parseWhereClause('implements_command=command:query')).toEqual({
    clauses: [
      {
        is_negated: false,
        term: {
          kind: 'relation_target',
          relation_name: 'implements_command',
          target_id: 'command:query',
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
          kind: 'relation_target',
          relation_name: 'uses_term',
          target_id: 'term:graph',
        },
      },
    ],
    success: true,
  });
});
