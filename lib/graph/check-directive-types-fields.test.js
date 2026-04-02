/** @import { PatramRepoConfig } from '../config/load-patram-config.types.ts'; */
import { expect, it } from 'vitest';

import { buildGraph } from './build-graph.js';
import { checkDirectiveMetadata } from './check-directive-metadata.js';
import { parseSourceFile } from '../parse/parse-claims.js';

const TASK_WITH_REF_SOURCE = [
  '# Example',
  '',
  'status: pending',
  'uses_term: ../reference/terms/graph.md',
  'uses_term: ./other.md',
  'uses_term: ./missing.md',
].join('\n');

/** @type {PatramRepoConfig} */
const repo_config = {
  fields: {
    status: {
      on: ['task'],
      type: /** @type {const} */ ('enum'),
      values: ['pending'],
    },
    term: {
      hidden: true,
      on: ['term'],
      type: /** @type {const} */ ('string'),
    },
    uses_term: {
      many: true,
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

it('reports unknown fields and invalid enum values', () => {
  const parse_result = parseSourceFile({
    path: 'docs/tasks/example.md',
    source: ['# Example', '', 'owner: max', 'status: blocked'].join('\n'),
  });
  const graph = buildGraph(repo_config, parse_result.claims);

  expect(
    checkDirectiveMetadata(graph, repo_config, parse_result.claims, [
      'docs/tasks/example.md',
    ]),
  ).toEqual([
    expect.objectContaining({
      code: 'directive.unknown_field',
      message: 'Directive "owner" is not declared in config.',
    }),
    expect.objectContaining({
      code: 'directive.invalid_enum',
      message: 'Directive "status" must be one of "pending".',
    }),
  ]);
});

it('reports missing ref targets and invalid ref target types', () => {
  const task_parse_result = parseSourceFile({
    path: 'docs/tasks/example.md',
    source: TASK_WITH_REF_SOURCE,
  });
  const other_task_parse_result = parseSourceFile({
    path: 'docs/tasks/other.md',
    source: ['# Other', '', 'status: pending'].join('\n'),
  });
  const term_parse_result = parseSourceFile({
    path: 'docs/reference/terms/graph.md',
    source: ['# Graph', '', 'term: graph'].join('\n'),
  });
  const graph = buildGraph(repo_config, [
    ...task_parse_result.claims,
    ...other_task_parse_result.claims,
    ...term_parse_result.claims,
  ]);

  expect(
    checkDirectiveMetadata(
      graph,
      repo_config,
      [
        ...task_parse_result.claims,
        ...other_task_parse_result.claims,
        ...term_parse_result.claims,
      ],
      [
        'docs/tasks/example.md',
        'docs/tasks/other.md',
        'docs/reference/terms/graph.md',
      ],
    ),
  ).toEqual([
    expect.objectContaining({
      code: 'directive.invalid_target_type',
      message: 'Directive "uses_term" must point to type "term".',
    }),
    expect.objectContaining({
      code: 'directive.path_not_found',
      message:
        'Directive "uses_term" points to missing file "docs/tasks/missing.md".',
    }),
  ]);
});
