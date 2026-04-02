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

it('rejects missing ad hoc and stored query inputs', () => {
  expect(resolveWhereClause(createRepoConfig({}), ['--where', '   '])).toEqual({
    error: {
      code: 'message',
      message: 'Query requires a Cypher statement.',
    },
    success: false,
  });
  expect(resolveWhereClause(createRepoConfig({}), ['--cypher', '   '])).toEqual(
    {
      error: {
        code: 'message',
        message: 'Query requires a Cypher statement.',
      },
      success: false,
    },
  );
  expect(resolveWhereClause(createRepoConfig({}), [])).toEqual({
    error: {
      code: 'message',
      message: 'Query requires "--cypher" or a stored query name.',
    },
    success: false,
  });
});

it('resolves stored queries and reports unknown names', () => {
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
  expect(resolveWhereClause(createRepoConfig({}), ['missing'])).toEqual({
    error: {
      code: 'unknown_stored_query',
      name: 'missing',
    },
    success: false,
  });
  expect(
    resolveWhereClause(
      createRepoConfig({
        pending: {
          cypher: "MATCH (n:Task) WHERE n.status = 'pending' RETURN n",
        },
      }),
      ['pendng'],
    ),
  ).toEqual({
    error: {
      code: 'unknown_stored_query',
      name: 'pendng',
      suggestion: 'pending',
    },
    success: false,
  });
});

/**
 * @param {Record<string, { cypher?: string }>} queries
 * @returns {$k$$l$load$j$patram$j$config$k$types$k$ts.PatramRepoConfig}
 */
function createRepoConfig(queries) {
  return {
    include: ['**/*'],
    queries,
  };
}
