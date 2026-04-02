/* eslint-disable max-lines-per-function */
/**
 * @import { PatramRepoConfig } from '../../config/load-patram-config.types.ts';
 */

import { Ansis } from 'ansis';
import { expect, it } from 'vitest';

import {
  getQuerySemanticDiagnostics,
  inspectQuery,
  renderQueryInspection,
} from './inspect.js';

/** @type {PatramRepoConfig} */
const REPO_CONFIG = {
  classes: {
    decision: {
      label: 'Decision',
    },
    document: {
      builtin: true,
      label: 'Document',
    },
    idea: {
      label: 'Idea',
    },
    plan: {
      label: 'Plan',
    },
    task: {
      label: 'Task',
    },
  },
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
    title: {
      type: 'string',
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

it('explains Cypher queries without executing them', () => {
  const inspection_result = inspectQuery(
    REPO_CONFIG,
    {
      query_source: {
        kind: 'ad_hoc',
      },
      where_clause:
        "MATCH (n:Plan) WHERE NOT EXISTS { MATCH (task:Task)-[:TRACKED_IN]->(n) WHERE task.status NOT IN ['done', 'dropped', 'superseded'] OR task.title CONTAINS 'Task' } RETURN n",
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

  const plain_output = renderQueryInspection(inspection_result.value, {
    color_enabled: false,
    renderer_name: 'plain',
  });

  expect(plain_output).toContain('Query explanation');
  expect(plain_output).toContain('source: ad hoc query');
  expect(plain_output).toContain('MATCH (n:Plan)');
  expect(plain_output).toContain('$class = plan');
  expect(plain_output).toContain('not aggregate any');
});

it('reports unknown relations during linting', () => {
  const inspection_result = inspectQuery(
    REPO_CONFIG,
    {
      query_source: {
        kind: 'stored_query',
        name: 'rollup',
      },
      where_clause:
        'MATCH (n:Plan) WHERE EXISTS { MATCH (task:Task)-[:TRACKED_TYPO]->(n) } RETURN n',
    },
    {
      inspection_mode: 'lint',
      limit: 25,
      offset: 0,
    },
  );

  expect(inspection_result).toEqual({
    diagnostics: [
      expect.objectContaining({
        code: 'query.unknown_relation',
        message: 'Unknown relation "tracked_typo" in traversal clause.',
        path: '<query:rollup>',
      }),
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
        "MATCH (n:Idea) WHERE n.status IN ['captured', 'exploring', 'planned'] AND NOT n.title CONTAINS 'Done' RETURN n",
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
  const rich_output = renderQueryInspection(inspection_result.value, {
    color_enabled: true,
    renderer_name: 'rich',
  });

  expect(rich_output).toContain(richAnsi.green('Query explanation'));
  expect(rich_output).toContain('stored query "ideas"');
  expect(rich_output).toContain("n.title CONTAINS 'Done'");
});

it('replaces parse diagnostic paths and renders lint inspections', () => {
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
        message: 'Expected the MATCH keyword.',
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
      where_clause: 'MATCH (n) RETURN n',
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
    'Query is valid.\n' +
      'source: ad hoc query\n' +
      'where: MATCH (n) RETURN n\n',
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
    where: 'MATCH (n) RETURN n',
  });
});

it('renders explain output as json', () => {
  const inspection_result = inspectQuery(
    REPO_CONFIG,
    {
      query_source: {
        kind: 'stored_query',
        name: 'links',
      },
      where_clause:
        "MATCH (n:Decision) WHERE COUNT { MATCH (task:Task)-[:DECIDED_BY]->(n) } >= 2 OR path(n) STARTS WITH 'docs/' RETURN n",
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

  expect(plain_output).toContain('comparison: >= 2');
  expect(plain_output).toContain('$path ^= docs/');
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
      "MATCH (n:Decision) WHERE COUNT { MATCH (task:Task)-[:DECIDED_BY]->(n) } >= 2 OR path(n) STARTS WITH 'docs/' RETURN n",
  });
});

it('reports unknown fields and invalid field operators during linting', () => {
  expect(
    inspectQuery(
      REPO_CONFIG,
      {
        query_source: {
          kind: 'ad_hoc',
        },
        where_clause: "MATCH (n) WHERE n.owner = 'emma' RETURN n",
      },
      {
        inspection_mode: 'lint',
        limit: 25,
        offset: 0,
      },
    ),
  ).toEqual({
    diagnostics: [
      expect.objectContaining({
        code: 'query.unknown_field',
        message: 'Unknown field "owner".',
        path: '<query>',
      }),
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
        where_clause: "MATCH (n) WHERE n.status STARTS WITH 'act' RETURN n",
      },
      {
        inspection_mode: 'lint',
        limit: 25,
        offset: 0,
      },
    ),
  ).toEqual({
    diagnostics: [
      expect.objectContaining({
        code: 'query.invalid_operator',
        message: 'Field "status" does not support the "^=" operator.',
        path: '<query>',
      }),
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
        where_clause: "MATCH (n) WHERE path(n) ENDS WITH '/README.md' RETURN n",
      },
      {
        inspection_mode: 'lint',
        limit: 25,
        offset: 0,
      },
    ).success,
  ).toBe(true);
});

it('collects semantic diagnostics from parsed expressions', () => {
  expect(
    getQuerySemanticDiagnostics(
      REPO_CONFIG,
      {
        kind: 'stored_query',
        name: 'diagnostic-coverage',
      },
      /** @type {any} */ ({
        expressions: [
          {
            kind: 'term',
            term: {
              column: 1,
              field_name: 'title',
              kind: 'field',
              operator: '^=',
              value: 'Plan',
            },
          },
          {
            kind: 'term',
            term: {
              column: 1,
              field_name: 'status',
              kind: 'field',
              operator: '$=',
              value: 'ing',
            },
          },
          {
            kind: 'term',
            term: {
              column: 1,
              kind: 'relation',
              relation_name: 'tracked_typo',
            },
          },
        ],
        kind: 'and',
      }),
    ),
  ).toEqual([
    expect.objectContaining({
      code: 'query.invalid_operator',
      message: 'Field "title" does not support the "^=" operator.',
      path: '<query:diagnostic-coverage>',
    }),
    expect.objectContaining({
      code: 'query.invalid_operator',
      message: 'Field "status" does not support the "$=" operator.',
      path: '<query:diagnostic-coverage>',
    }),
    expect.objectContaining({
      code: 'query.unknown_relation',
      message: 'Unknown relation "tracked_typo" in relation clause.',
      path: '<query:diagnostic-coverage>',
    }),
  ]);
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
        kind: 'ad_hoc',
      },
      where_clause: 'synthetic query for renderer coverage',
    },
    {
      color_enabled: false,
      renderer_name: 'plain',
    },
  );

  expect(inspection_output).toContain('1. not');
  expect(inspection_output).toContain('1. any of');
  expect(inspection_output).toContain('tracked_in exists');
  expect(inspection_output).toContain('comparison: >= 2');
});
