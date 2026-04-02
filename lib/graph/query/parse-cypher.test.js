/* eslint-disable max-lines-per-function */
/**
 * @import { PatramRepoConfig } from '../../config/load-patram-config.types.ts';
 */
/**
 * @import { CypherParserState } from './cypher.types.ts';
 */

import { expect, it } from 'vitest';

import { tokenizeCypher } from './cypher-tokenize.js';
import { parseCypherExpression } from './parse-cypher.js';

it('parses supported cypher expressions', () => {
  const queries = [
    "MATCH (n:Task) WHERE n.title STARTS WITH 'Plan' AND n.status CONTAINS 'rea' RETURN n",
    "MATCH (n) WHERE n.status IN ['ready', 'pending'] OR n.status NOT IN ['done'] RETURN n",
    "MATCH (n) WHERE NOT (n.status = 'ready') RETURN n",
    "MATCH (n:Task) WHERE id(n) = 'task:query-command' RETURN n",
    "MATCH (n) WHERE path(n) STARTS WITH 'docs/tasks/' RETURN n",
    "MATCH (n) WHERE path(n) ENDS WITH '/query-command.md' RETURN n",
    'MATCH (n) WHERE EXISTS { MATCH (n)-[:TRACKED_IN]->(task:Task) } RETURN n',
    'MATCH (n) WHERE COUNT { MATCH (n)-[:TRACKED_IN]->(task) } >= 2 RETURN n',
  ];

  for (const query_text of queries) {
    expect(parseCypherExpression(createParserState(query_text)).success).toBe(
      true,
    );
  }
});

it('reports recoverable cypher parse failures', () => {
  expect(
    parseCypherExpression(createParserState('MATCH (:Task) RETURN n')),
  ).toEqual({
    diagnostic: {
      code: 'query.invalid',
      column: 15,
      level: 'error',
      line: 1,
      message: 'Cypher root MATCH requires a variable.',
      path: '<query>',
    },
    success: false,
  });

  expect(
    parseCypherExpression(createParserState('MATCH (n) WHERE n. RETURN n')),
  ).toEqual({
    diagnostic: {
      code: 'query.invalid',
      column: 27,
      level: 'error',
      line: 1,
      message: 'Expected a Cypher predicate operator.',
      path: '<query>',
    },
    success: false,
  });
});

it('throws for invalid subquery and comparison syntax', () => {
  expect(() =>
    parseCypherExpression(createParserState('MATCH (n) WHERE EXISTS RETURN n')),
  ).toThrow('Expected the "{" token.');
  expect(
    parseCypherExpression(
      createParserState(
        'MATCH (n) WHERE COUNT { MATCH (n)-[:TRACKED_IN]->(task) } IN [1] RETURN n',
      ),
    ),
  ).toEqual({
    diagnostic: {
      code: 'query.invalid',
      column: 62,
      level: 'error',
      line: 1,
      message: 'Expected a count comparison operator.',
      path: '<query>',
    },
    success: false,
  });
  expect(
    parseCypherExpression(
      createParserState(
        'MATCH (n) WHERE COUNT { MATCH (n)-[:TRACKED_IN]->(task) } >= ready RETURN n',
      ),
    ),
  ).toEqual({
    diagnostic: {
      code: 'query.invalid',
      column: 68,
      level: 'error',
      line: 1,
      message: 'Expected a count comparison value.',
      path: '<query>',
    },
    success: false,
  });
  expect(
    parseCypherExpression(
      createParserState("MATCH (n) WHERE n.status LIKE 'ready' RETURN n"),
    ),
  ).toEqual({
    diagnostic: {
      code: 'query.invalid',
      column: 26,
      level: 'error',
      line: 1,
      message: 'Expected a Cypher predicate operator.',
      path: '<query>',
    },
    success: false,
  });
  expect(
    parseCypherExpression(createParserState('MATCH (n) RETURN other')),
  ).toEqual({
    diagnostic: {
      code: 'query.invalid',
      column: 23,
      level: 'error',
      line: 1,
      message: 'Cypher RETURN must return the root MATCH variable.',
      path: '<query>',
    },
    success: false,
  });
  expect(
    parseCypherExpression(
      createParserState("MATCH (n) WHERE id = 'task:query-command' RETURN n"),
    ),
  ).toEqual({
    diagnostic: {
      code: 'query.invalid',
      column: 20,
      level: 'error',
      line: 1,
      message: 'Expected a Cypher predicate.',
      path: '<query>',
    },
    success: false,
  });
});

/**
 * @param {string} query_text
 * @returns {CypherParserState}
 */
function createParserState(query_text) {
  const tokenize_result = tokenizeCypher(query_text);

  if (!tokenize_result.success) {
    throw new Error('Expected tokenization to succeed.');
  }

  /** @type {PatramRepoConfig} */
  const repo_config = {
    classes: {
      task: {
        label: 'Task',
      },
    },
    fields: {
      status: {
        type: 'string',
      },
      title: {
        type: 'string',
      },
    },
    include: ['**/*'],
    queries: {},
    relations: {
      tracked_in: {
        from: ['task'],
        to: ['task'],
      },
    },
  };

  return {
    bindings: {},
    index: 0,
    query_text,
    repo_config,
    root_variable_name: null,
    tokens: tokenize_result.tokens,
  };
}
