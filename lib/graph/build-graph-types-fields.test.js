/** @import * as $k$$k$$l$parse$l$parse$j$claims$k$types$k$ts from '../parse/parse-claims.types.ts'; */
/** @import { PatramRepoConfig } from '../config/load-patram-config.types.ts'; */
import { expect, it } from 'vitest';

import { buildGraph } from './build-graph.js';
import { parseSourceFile } from '../parse/parse-claims.js';

it('promotes path-backed and semantic document types from the v2 config model', () => {
  const graph = buildGraph(createConfig(), [
    ...parseClaims(
      'docs/reference/commands/query.md',
      ['# Query', '', 'command: query', 'summary: Run a query.'].join('\n'),
    ),
    ...parseClaims(
      'docs/tasks/v2/config.md',
      ['# Config Task', '', 'status: ready'].join('\n'),
    ),
  ]);
  const command_node = graph.nodes['command:query'];
  const task_node = graph.nodes['task:v2/config'];

  expect(command_node.identity).toEqual({
    class_name: 'command',
    id: 'command:query',
    path: 'docs/reference/commands/query.md',
  });
  expect(command_node.metadata.summary).toBe('Run a query.');
  expect(command_node.metadata.title).toBe('Query');

  expect(task_node.identity).toEqual({
    class_name: 'task',
    id: 'task:v2/config',
    path: 'docs/tasks/v2/config.md',
  });
  expect(task_node.metadata.status).toBe('ready');
  expect(task_node.metadata.title).toBe('Config Task');
});

it('emits ref-field edges through canonical target identities', () => {
  const graph = buildGraph(createConfig(), [
    ...parseClaims(
      'docs/reference/terms/graph.md',
      ['# Graph', '', 'term: graph'].join('\n'),
    ),
    ...parseClaims(
      'docs/tasks/v2/config.md',
      [
        '# Config Task',
        '',
        'status: ready',
        'uses_term: docs/reference/terms/graph.md',
      ].join('\n'),
    ),
  ]);

  expect(graph.edges).toContainEqual({
    from: 'task:v2/config',
    id: 'edge:1',
    origin: {
      column: 1,
      line: 4,
      path: 'docs/tasks/v2/config.md',
    },
    relation: 'uses_term',
    to: 'term:graph',
  });
});

/**
 * @returns {PatramRepoConfig}
 */
function createConfig() {
  return {
    fields: {
      command: {
        hidden: true,
        on: ['command'],
        type: /** @type {const} */ ('string'),
      },
      status: {
        on: ['task'],
        type: /** @type {const} */ ('enum'),
        values: ['ready'],
      },
      summary: {
        on: ['command'],
        type: /** @type {const} */ ('string'),
      },
      term: {
        hidden: true,
        on: ['term'],
        type: /** @type {const} */ ('string'),
      },
      uses_term: {
        many: true,
        on: ['task'],
        to: 'term',
        type: /** @type {const} */ ('ref'),
      },
    },
    include: ['docs/**/*.md'],
    queries: {},
    types: {
      command: {
        defined_by: 'command',
      },
      task: {
        in: ['docs/tasks/**/*.md'],
      },
      term: {
        defined_by: 'term',
      },
    },
  };
}

/**
 * @param {string} path
 * @param {string} source
 * @returns {$k$$k$$l$parse$l$parse$j$claims$k$types$k$ts.PatramClaim[]}
 */
function parseClaims(path, source) {
  return parseSourceFile({
    path,
    source,
  }).claims;
}
