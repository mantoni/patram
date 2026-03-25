/** @import * as $k$$l$load$j$patram$j$config$k$types$k$ts from './load-patram-config.types.ts'; */
import { expect, it } from 'vitest';

import { resolveWhereClause } from './resolve-where-clause.js';

it('resolves ad hoc where clauses and trims the result', () => {
  expect(
    resolveWhereClause(createRepoConfig({}), ['--where', '  kind=task  ']),
  ).toEqual({
    success: true,
    value: {
      query_source: {
        kind: 'ad_hoc',
      },
      where_clause: 'kind=task',
    },
  });
});

it('rejects missing ad hoc and stored query inputs', () => {
  expect(resolveWhereClause(createRepoConfig({}), ['--where', '   '])).toEqual({
    message: 'Query requires a where clause.',
    success: false,
  });
  expect(resolveWhereClause(createRepoConfig({}), [])).toEqual({
    message: 'Query requires "--where" or a stored query name.',
    success: false,
  });
});

it('resolves stored queries and reports unknown names', () => {
  expect(
    resolveWhereClause(
      createRepoConfig({
        pending: {
          where: 'status=pending',
        },
      }),
      ['pending'],
    ),
  ).toEqual({
    success: true,
    value: {
      query_source: {
        kind: 'stored_query',
        name: 'pending',
      },
      where_clause: 'status=pending',
    },
  });
  expect(resolveWhereClause(createRepoConfig({}), ['missing'])).toEqual({
    message: 'Stored query "missing" was not found.',
    success: false,
  });
});

/**
 * @param {Record<string, { where: string }>} queries
 * @returns {$k$$l$load$j$patram$j$config$k$types$k$ts.PatramRepoConfig}
 */
function createRepoConfig(queries) {
  return {
    include: ['**/*'],
    queries,
  };
}
