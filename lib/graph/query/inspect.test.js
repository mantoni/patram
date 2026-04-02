/** @import * as $k$$k$$l$$k$$k$$l$config$l$load$j$patram$j$config$k$types$k$ts from '../../config/load-patram-config.types.ts'; */
import { expect, it } from 'vitest';

import { inspectQuery, renderQueryInspection } from './inspect.js';
import { parseQueryExpression } from './parse-query.js';
import { getQuerySemanticDiagnostics } from './inspect.js';

/** @type {$k$$k$$l$$k$$k$$l$config$l$load$j$patram$j$config$k$types$k$ts.PatramRepoConfig} */
const repo_config = {
  fields: {
    status: {
      type: /** @type {const} */ ('enum'),
      values: ['active', 'done', 'pending', 'superseded'],
    },
    tracked_in: {
      many: true,
      to: 'document',
      type: /** @type {const} */ ('ref'),
    },
  },
  include: [],
  queries: {},
  types: {
    plan: {
      in: ['docs/plans/**/*.md'],
      label: 'Plan',
    },
    task: {
      in: ['docs/tasks/**/*.md'],
      label: 'Task',
    },
  },
};

it('explains valid Cypher queries', () => {
  const inspection_result = inspectQuery(
    repo_config,
    {
      query_source: {
        kind: 'ad_hoc',
      },
      where_clause:
        "MATCH (n:Plan) WHERE NOT EXISTS { MATCH (task:Task)-[:TRACKED_IN]->(n) WHERE task.status <> 'done' } RETURN n",
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
  expect(plain_output).toContain('MATCH (n:Plan)');
  expect(plain_output).toContain('TRACKED_IN');
});

it('reports unknown relations during linting', () => {
  const inspection_result = inspectQuery(
    repo_config,
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

it('derives relation names from ref fields for semantic diagnostics', () => {
  const parse_result = parseQueryExpression(
    "MATCH (n:Plan) WHERE EXISTS { MATCH (task:Task)-[:TRACKED_IN]->(n) WHERE task.status = 'pending' } RETURN n",
    repo_config,
  );

  expect(parse_result.success).toBe(true);
  if (!parse_result.success) {
    throw new Error('Expected query parsing to succeed.');
  }
  expect(
    getQuerySemanticDiagnostics(
      repo_config,
      { kind: 'ad_hoc' },
      parse_result.expression,
    ),
  ).toEqual([]);
});
