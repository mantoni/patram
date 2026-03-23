import { expect, it } from 'vitest';

import { inspectQuery, renderQueryInspection } from './query-inspection.js';

const REPO_CONFIG = {
  include: [],
  queries: {},
  relations: {
    decided_by: {
      from: ['document'],
      to: ['document'],
    },
    tracked_in: {
      from: ['document'],
      to: ['document'],
    },
  },
};

it('explains nested traversal aggregates without executing the query', () => {
  const inspection_result = inspectQuery(
    REPO_CONFIG,
    {
      query_source: {
        kind: 'ad_hoc',
      },
      where_clause:
        'kind=plan and none(in:tracked_in, kind=task and status not in [done, dropped, superseded])',
    },
    {
      inspection_mode: 'explain',
      limit: 25,
      offset: 0,
    },
  );

  expect(inspection_result.success).toBe(true);

  if (!inspection_result.success) {
    return;
  }

  expect(
    renderQueryInspection(inspection_result.value, {
      color_enabled: false,
      renderer_name: 'plain',
    }),
  ).toBe(
    'Query explanation\n' +
      'source: ad hoc query\n' +
      'where: kind=plan and none(in:tracked_in, kind=task and status not in [done, dropped, superseded])\n' +
      'offset: 0\n' +
      'limit: 25\n' +
      '\n' +
      'clauses:\n' +
      '1. kind = plan\n' +
      '2. aggregate none\n' +
      '   traversal: in:tracked_in\n' +
      '   nested clauses:\n' +
      '     1. kind = task\n' +
      '     2. status not in [done, dropped, superseded]\n',
  );
});

it('reports unknown nested traversal relations during linting', () => {
  const inspection_result = inspectQuery(
    REPO_CONFIG,
    {
      query_source: {
        kind: 'stored_query',
        name: 'rollup',
      },
      where_clause:
        'kind=plan and none(in:tracked_typo, kind=task and status=pending)',
    },
    {
      inspection_mode: 'lint',
      limit: 25,
      offset: 0,
    },
  );

  expect(inspection_result).toEqual({
    diagnostics: [
      {
        code: 'query.unknown_relation',
        column: 20,
        level: 'error',
        line: 1,
        message: 'Unknown relation "tracked_typo" in traversal clause.',
        path: '<query:rollup>',
      },
    ],
    success: false,
  });
});
