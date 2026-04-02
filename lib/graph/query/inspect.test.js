/* eslint-disable max-lines, max-lines-per-function */
/**
 * @import { PatramRepoConfig } from '../../config/load-patram-config.types.ts';
 */

import { Ansis } from 'ansis';
import { expect, it } from 'vitest';

import { inspectQuery, renderQueryInspection } from './inspect.js';

/** @type {PatramRepoConfig} */
const REPO_CONFIG = {
  fields: {
    status: {
      type: 'enum',
      values: [
        'active',
        'captured',
        'done',
        'dropped',
        'exploring',
        'pending',
        'planned',
        'superseded',
      ],
    },
  },
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
        '$class=plan and none(in:tracked_in, $class=task and (status not in [done, dropped, superseded] or title~Task))',
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
      'where: $class=plan and none(in:tracked_in, $class=task and (status not in [done, dropped, superseded] or title~Task))\n' +
      'offset: 0\n' +
      'limit: 25\n' +
      '\n' +
      'expression:\n' +
      '1. $class = plan\n' +
      '2. aggregate none\n' +
      '   traversal: in:tracked_in\n' +
      '   nested expression:\n' +
      '     1. $class = task\n' +
      '     2. any of\n' +
      '        1. status not in [done, dropped, superseded]\n' +
      '        2. title ~ Task\n',
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
        '$class=plan and none(in:tracked_typo, $class=task and status=pending)',
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
        column: 22,
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
      where_clause:
        '$class=idea or status in [captured, exploring, planned] and not title~Done',
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

  const richAnsi = new Ansis(3);

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
    `${richAnsi.green('Query explanation')}\n` +
      `${richAnsi.gray('source:')} stored query "ideas"\n` +
      `${richAnsi.gray('where:')} $class=idea or status in [captured, exploring, planned] and not title~Done\n` +
      `${richAnsi.gray('offset:')} 0\n` +
      `${richAnsi.gray('limit:')} 25\n` +
      '\n' +
      `${richAnsi.gray('expression:')}\n` +
      '1. any of\n' +
      '   1. $class = idea\n' +
      '   2. all of\n' +
      '      1. status in [captured, exploring, planned]\n' +
      '      2. not title ~ Done\n',
  );
});

it('replaces parse diagnostic paths and renders successful lint inspections', () => {
  expect(
    inspectQuery(
      REPO_CONFIG,
      {
        query_source: {
          kind: 'stored_query',
          name: 'broken',
        },
        where_clause: '(',
      },
      {
        inspection_mode: 'lint',
        limit: 10,
        offset: 5,
      },
    ),
  ).toEqual({
    diagnostics: [
      {
        code: 'query.invalid',
        column: 2,
        level: 'error',
        line: 1,
        message: 'Expected a query term.',
        path: '<query:broken>',
      },
    ],
    success: false,
  });

  const lint_result = inspectQuery(
    REPO_CONFIG,
    {
      query_source: {
        kind: 'ad_hoc',
      },
      where_clause: 'tracked_in:*',
    },
    {
      inspection_mode: 'lint',
      limit: 10,
      offset: 5,
    },
  );

  expect(lint_result.success).toBe(true);

  if (!lint_result.success) {
    return;
  }

  expect(
    renderQueryInspection(lint_result.value, {
      color_enabled: false,
      renderer_name: 'plain',
    }),
  ).toBe(
    'Query is valid.\n' + 'source: ad hoc query\n' + 'where: tracked_in:*\n',
  );
  expect(
    JSON.parse(
      renderQueryInspection(lint_result.value, {
        color_enabled: false,
        renderer_name: 'json',
      }),
    ),
  ).toEqual({
    diagnostics: [],
    mode: 'lint',
    source: {
      kind: 'ad_hoc',
    },
    where: 'tracked_in:*',
  });

  const filename_lint_result = inspectQuery(
    REPO_CONFIG,
    {
      query_source: {
        kind: 'ad_hoc',
      },
      where_clause: '$filename=README.md',
    },
    {
      inspection_mode: 'lint',
      limit: 10,
      offset: 5,
    },
  );

  expect(filename_lint_result.success).toBe(true);
});

it('explains relation terms, relation targets, and count aggregates in json output', () => {
  const inspection_result = inspectQuery(
    {
      ...REPO_CONFIG,
      fields: {
        ...REPO_CONFIG.fields,
        path_value: /** @type {any} */ ({
          query: {
            prefix: true,
          },
          type: 'path',
        }),
      },
    },
    {
      query_source: {
        kind: 'stored_query',
        name: 'links',
      },
      where_clause:
        'tracked_in:* or decided_by=doc:docs/plans/v0/plan.md or count(in:tracked_in, $class=task) >= 2 or path_value^=docs/',
    },
    {
      inspection_mode: 'explain',
      limit: 5,
      offset: 1,
    },
  );

  expect(inspection_result.success).toBe(true);

  if (!inspection_result.success) {
    return;
  }

  const plain_output = renderQueryInspection(inspection_result.value, {
    color_enabled: false,
    renderer_name: 'plain',
  });

  expect(plain_output).toContain('1. tracked_in exists');
  expect(plain_output).toContain('2. decided_by = doc:docs/plans/v0/plan.md');
  expect(plain_output).toContain('comparison: >= 2');
  expect(
    JSON.parse(
      renderQueryInspection(inspection_result.value, {
        color_enabled: false,
        renderer_name: 'json',
      }),
    ),
  ).toEqual({
    diagnostics: [],
    execution: {
      limit: 5,
      offset: 1,
    },
    expression: inspection_result.value.expression,
    mode: 'explain',
    source: {
      kind: 'stored_query',
      name: 'links',
    },
    where:
      'tracked_in:* or decided_by=doc:docs/plans/v0/plan.md or count(in:tracked_in, $class=task) >= 2 or path_value^=docs/',
  });
});

it('reports reserved, unknown, and incompatible field operators during linting', () => {
  expect(
    inspectQuery(
      REPO_CONFIG,
      {
        query_source: {
          kind: 'ad_hoc',
        },
        where_clause: '$status=active',
      },
      {
        inspection_mode: 'lint',
        limit: 25,
        offset: 0,
      },
    ),
  ).toEqual({
    diagnostics: [
      {
        code: 'query.reserved_field',
        column: 1,
        level: 'error',
        line: 1,
        message: 'Reserved field "$status" is not available.',
        path: '<query>',
      },
    ],
    success: false,
  });

  expect(
    inspectQuery(
      REPO_CONFIG,
      {
        query_source: {
          kind: 'ad_hoc',
        },
        where_clause: 'owner=emma',
      },
      {
        inspection_mode: 'lint',
        limit: 25,
        offset: 0,
      },
    ),
  ).toEqual({
    diagnostics: [
      {
        code: 'query.unknown_field',
        column: 1,
        level: 'error',
        line: 1,
        message: 'Unknown field "owner".',
        path: '<query>',
      },
    ],
    success: false,
  });

  expect(
    inspectQuery(
      REPO_CONFIG,
      {
        query_source: {
          kind: 'ad_hoc',
        },
        where_clause: 'title^=Guide',
      },
      {
        inspection_mode: 'lint',
        limit: 25,
        offset: 0,
      },
    ),
  ).toEqual({
    diagnostics: [
      {
        code: 'query.invalid_operator',
        column: 1,
        level: 'error',
        line: 1,
        message: 'Field "title" does not support the "^=" operator.',
        path: '<query>',
      },
    ],
    success: false,
  });

  const path_glob_result = inspectQuery(
    REPO_CONFIG,
    {
      query_source: {
        kind: 'ad_hoc',
      },
      where_clause: '$path*=docs/**/README.md',
    },
    {
      inspection_mode: 'lint',
      limit: 25,
      offset: 0,
    },
  );

  expect(path_glob_result.success).toBe(true);

  expect(
    inspectQuery(
      REPO_CONFIG,
      {
        query_source: {
          kind: 'ad_hoc',
        },
        where_clause: '$class*=task',
      },
      {
        inspection_mode: 'lint',
        limit: 25,
        offset: 0,
      },
    ),
  ).toEqual({
    diagnostics: [
      {
        code: 'query.invalid_operator',
        column: 1,
        level: 'error',
        line: 1,
        message: 'Field "$class" does not support the "*=" operator.',
        path: '<query>',
      },
    ],
    success: false,
  });

  expect(
    inspectQuery(
      REPO_CONFIG,
      {
        query_source: {
          kind: 'ad_hoc',
        },
        where_clause: '$filename^=READ',
      },
      {
        inspection_mode: 'lint',
        limit: 25,
        offset: 0,
      },
    ),
  ).toEqual({
    diagnostics: [
      {
        code: 'query.invalid_operator',
        column: 1,
        level: 'error',
        line: 1,
        message: 'Field "$filename" does not support the "^=" operator.',
        path: '<query>',
      },
    ],
    success: false,
  });

  expect(
    inspectQuery(
      REPO_CONFIG,
      {
        query_source: {
          kind: 'ad_hoc',
        },
        where_clause: '$class~task',
      },
      {
        inspection_mode: 'lint',
        limit: 25,
        offset: 0,
      },
    ),
  ).toEqual({
    diagnostics: [
      {
        code: 'query.invalid_operator',
        column: 1,
        level: 'error',
        line: 1,
        message: 'Field "$class" does not support the "~" operator.',
        path: '<query>',
      },
    ],
    success: false,
  });

  expect(
    inspectQuery(
      REPO_CONFIG,
      {
        query_source: {
          kind: 'ad_hoc',
        },
        where_clause: 'status^=act',
      },
      {
        inspection_mode: 'lint',
        limit: 25,
        offset: 0,
      },
    ),
  ).toEqual({
    diagnostics: [
      {
        code: 'query.invalid_operator',
        column: 1,
        level: 'error',
        line: 1,
        message: 'Field "status" does not support the "^=" operator.',
        path: '<query>',
      },
    ],
    success: false,
  });

  expect(
    inspectQuery(
      REPO_CONFIG,
      {
        query_source: {
          kind: 'ad_hoc',
        },
        where_clause: 'status~act',
      },
      {
        inspection_mode: 'lint',
        limit: 25,
        offset: 0,
      },
    ),
  ).toEqual({
    diagnostics: [
      {
        code: 'query.invalid_operator',
        column: 1,
        level: 'error',
        line: 1,
        message: 'Field "status" does not support the "~" operator.',
        path: '<query>',
      },
    ],
    success: false,
  });

  expect(
    inspectQuery(
      REPO_CONFIG,
      {
        query_source: {
          kind: 'ad_hoc',
        },
        where_clause: 'status<active',
      },
      {
        inspection_mode: 'lint',
        limit: 25,
        offset: 0,
      },
    ),
  ).toEqual({
    diagnostics: [
      {
        code: 'query.invalid_operator',
        column: 1,
        level: 'error',
        line: 1,
        message: 'Field "status" does not support the "<" operator.',
        path: '<query>',
      },
    ],
    success: false,
  });

  expect(
    inspectQuery(
      REPO_CONFIG,
      {
        query_source: {
          kind: 'ad_hoc',
        },
        where_clause: 'blocked_typo:*',
      },
      {
        inspection_mode: 'lint',
        limit: 25,
        offset: 0,
      },
    ),
  ).toEqual({
    diagnostics: [
      {
        code: 'query.unknown_relation',
        column: 1,
        level: 'error',
        line: 1,
        message: 'Unknown relation "blocked_typo" in relation clause.',
        path: '<query>',
      },
    ],
    success: false,
  });
});

it('renders grouped not expressions with null limits and aggregate details', () => {
  const inspection_output = renderQueryInspection(
    {
      execution: {
        limit: null,
        offset: 0,
      },
      expression: {
        expressions: [
          {
            expression: {
              expressions: [
                {
                  kind: 'term',
                  term: {
                    column: 1,
                    kind: 'relation',
                    relation_name: 'tracked_in',
                  },
                },
                {
                  kind: 'term',
                  term: {
                    column: 1,
                    kind: 'relation_target',
                    relation_name: 'decided_by',
                    target_id: 'doc:docs/plans/v0/plan.md',
                  },
                },
              ],
              kind: 'or',
            },
            kind: 'not',
          },
          {
            kind: 'term',
            term: /** @type {any} */ ({
              aggregate_name: 'count',
              comparison: '>=',
              column: 1,
              expression: {
                kind: 'term',
                term: {
                  column: 1,
                  field_name: 'status',
                  kind: 'field',
                  operator: '=',
                  value: 'pending',
                },
              },
              kind: 'aggregate',
              traversal: {
                column: 1,
                direction: 'in',
                relation_name: 'tracked_in',
              },
              value: 2,
            }),
          },
        ],
        kind: 'and',
      },
      inspection_mode: 'explain',
      query_source: {
        kind: 'stored_query',
        name: 'rollup',
      },
      where_clause:
        'not (tracked_in:* or decided_by=doc:docs/plans/v0/plan.md) and count(in:tracked_in, status=pending) >= 2',
    },
    {
      color_enabled: false,
      renderer_name: 'plain',
    },
  );

  expect(inspection_output).toContain('limit: none');
  expect(inspection_output).toContain('1. not');
  expect(inspection_output).toContain('1. tracked_in exists');
  expect(inspection_output).toContain(
    '2. decided_by = doc:docs/plans/v0/plan.md',
  );
  expect(inspection_output).toContain('comparison: >= 2');
});

it('throws on unsupported explain expressions and terms', () => {
  expect(() => {
    renderQueryInspection(
      {
        execution: {
          limit: 1,
          offset: 0,
        },
        expression: /** @type {any} */ ({
          kind: 'unexpected',
        }),
        inspection_mode: 'explain',
        query_source: {
          kind: 'ad_hoc',
        },
        where_clause: 'broken',
      },
      {
        color_enabled: false,
        renderer_name: 'plain',
      },
    );
  }).toThrow('Unsupported explain expression.');

  expect(() => {
    renderQueryInspection(
      {
        execution: {
          limit: 1,
          offset: 0,
        },
        expression: {
          kind: 'term',
          term: /** @type {any} */ ({
            kind: 'unexpected',
          }),
        },
        inspection_mode: 'explain',
        query_source: {
          kind: 'ad_hoc',
        },
        where_clause: 'broken',
      },
      {
        color_enabled: false,
        renderer_name: 'plain',
      },
    );
  }).toThrow('Expected a parsed query term.');
});
