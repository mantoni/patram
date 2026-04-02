/** @import * as $k$$k$$l$$k$$k$$l$config$l$load$j$patram$j$config$k$types$k$ts from '../../config/load-patram-config.types.ts'; */
import { expect, it } from 'vitest';

import { queryGraph } from './execute.js';
import { getQuerySemanticDiagnostics } from './inspect.js';
import { parseQueryExpression } from './parse-query.js';

/** @type {$k$$k$$l$$k$$k$$l$config$l$load$j$patram$j$config$k$types$k$ts.PatramRepoConfig} */
const repo_config = {
  fields: {
    status: {
      type: /** @type {const} */ ('enum'),
      values: ['ready'],
    },
    uses_term: {
      to: 'term',
      type: /** @type {const} */ ('ref'),
    },
  },
  include: ['docs/**/*.md'],
  queries: {},
  types: {
    task: {
      in: ['docs/tasks/**/*.md'],
    },
    term: {
      defined_by: 'term',
    },
  },
};

it('derives known query relations from ref fields', () => {
  const parse_result = parseQueryExpression(
    'MATCH (n:Task) WHERE EXISTS { MATCH (n)-[:USES_TERM]->(term:Term) } RETURN n',
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

it('treats ref fields as relations instead of queryable scalar fields', () => {
  const parse_result = parseQueryExpression(
    "MATCH (n:Task) WHERE n.uses_term = 'term:graph' RETURN n",
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
  ).toEqual([
    expect.objectContaining({
      message: 'Unknown field "uses_term".',
    }),
  ]);
});

it('deduplicates canonical nodes when doc aliases point to the same node', () => {
  const graph_node = {
    identity: {
      class_name: 'term',
      id: 'term:graph',
      path: 'docs/reference/terms/graph.md',
    },
    key: 'graph',
    metadata: {
      term: 'graph',
      title: 'Graph',
    },
  };
  const result = queryGraph(
    {
      edges: [],
      nodes: {
        'doc:docs/reference/terms/graph.md': graph_node,
        'term:graph': graph_node,
      },
    },
    'MATCH (n:Term) RETURN n',
    repo_config,
  );

  expect(result.diagnostics).toEqual([]);
  expect(result.nodes).toEqual([graph_node]);
  expect(result.total_count).toBe(1);
});
