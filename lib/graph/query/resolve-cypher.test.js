/** @import * as $k$$l$load$j$patram$j$config$k$types$k$ts from '../../config/load-patram-config.types.ts'; */
import { expect, it } from 'vitest';

import { resolveWhereClause } from './resolve.js';

it('resolves ad hoc cypher queries and trims the result', () => {
  expect(
    resolveWhereClause(createRepoConfig({}), [
      '--cypher',
      '  MATCH (n:Task) RETURN n  ',
    ]),
  ).toEqual({
    success: true,
    value: {
      query_source: {
        kind: 'ad_hoc',
      },
      where_clause: 'MATCH (n:Task) RETURN n',
    },
  });
});

it('resolves stored cypher queries', () => {
  expect(
    resolveWhereClause(
      createRepoConfig({
        pending: {
          cypher: "MATCH (n:Task) WHERE n.status = 'pending' RETURN n",
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
      where_clause: "MATCH (n:Task) WHERE n.status = 'pending' RETURN n",
    },
  });
});

/**
 * @param {Record<string, { cypher?: string, where?: string }>} queries
 * @returns {$k$$l$load$j$patram$j$config$k$types$k$ts.PatramRepoConfig}
 */
function createRepoConfig(queries) {
  return {
    include: ['**/*'],
    queries,
  };
}
