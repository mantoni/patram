import { Ansis } from 'ansis';
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

it('renders rich explain output without throwing', () => {
  const inspection_result = inspectQuery(
    REPO_CONFIG,
    {
      query_source: {
        kind: 'stored_query',
        name: 'ideas',
      },
      where_clause: 'kind=idea and status in [captured, exploring, planned]',
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

  const rich_ansi = new Ansis(3);

  expect(() =>
    renderQueryInspection(inspection_result.value, {
      color_enabled: true,
      renderer_name: 'rich',
    }),
  ).not.toThrow();

  expect(
    renderQueryInspection(inspection_result.value, {
      color_enabled: true,
      renderer_name: 'rich',
    }),
  ).toBe(
    `${rich_ansi.green('Query explanation')}\n` +
      `${rich_ansi.gray('source:')} stored query "ideas"\n` +
      `${rich_ansi.gray('where:')} kind=idea and status in [captured, exploring, planned]\n` +
      `${rich_ansi.gray('offset:')} 0\n` +
      `${rich_ansi.gray('limit:')} 25\n` +
      '\n' +
      `${rich_ansi.gray('clauses:')}\n` +
      '1. kind = idea\n' +
      '2. status in [captured, exploring, planned]\n',
  );
});
