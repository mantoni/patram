/* eslint-disable max-lines-per-function */
/**
 * @import { PatramRepoConfig } from '../../config/load-patram-config.types.ts';
 */
/**
 * @import { ParsedExpression } from '../parse-where-clause.types.ts';
 * @import { CypherParserState } from './cypher.types.ts';
 */

import { expect, it } from 'vitest';

import { createAlwaysTrueExpression } from './cypher-support.js';
import { tokenizeCypher } from './cypher-tokenize.js';
import {
  parseCypherListValue,
  parseCypherScalarValue,
  parseNodePattern,
  parseSubqueryAggregate,
} from './parse-cypher-patterns.js';

it('parses node patterns and scalar values', () => {
  expect(parseNodePattern(createParserState('(n:Task)'))).toEqual({
    column: 1,
    label_name: 'Task',
    variable_name: 'n',
  });
  expect(parseNodePattern(createParserState('(:Task)'))).toEqual({
    column: 1,
    label_name: 'Task',
    variable_name: null,
  });

  expect(parseCypherScalarValue(createParserState("'ready'"))).toBe('ready');
  expect(parseCypherScalarValue(createParserState('2'))).toBe('2');
  expect(parseCypherScalarValue(createParserState('status'))).toBe('status');
  expect(
    parseCypherListValue(createParserState("['ready', 2, status]")),
  ).toEqual(['ready', '2', 'status']);
});

it('parses cypher subquery aggregates in both directions', () => {
  const outgoing_state = createParserState(
    '{ MATCH (n)-[:TRACKED_IN]->(task:Task) }',
  );
  outgoing_state.root_variable_name = 'n';

  expect(
    parseSubqueryAggregate(outgoing_state, 1, 'any', createBooleanStub()),
  ).toEqual({
    success: true,
    term: {
      aggregate_name: 'any',
      expression: {
        kind: 'term',
        term: {
          column: 28,
          field_name: '$class',
          kind: 'field',
          operator: '=',
          value: 'task',
        },
      },
      kind: 'aggregate',
      traversal: {
        column: 12,
        direction: 'out',
        relation_name: 'tracked_in',
      },
    },
  });

  const incoming_state = createParserState(
    '{ MATCH (task)<-[:TRACKED_IN]-(n) }',
  );
  incoming_state.root_variable_name = 'n';

  expect(
    parseSubqueryAggregate(incoming_state, 1, 'count', createBooleanStub()),
  ).toEqual({
    success: true,
    term: {
      aggregate_name: 'count',
      expression: createAlwaysTrueExpression(1),
      kind: 'aggregate',
      traversal: {
        column: 15,
        direction: 'out',
        relation_name: 'tracked_in',
      },
    },
  });
});

it('parses nested subquery filters and reports invalid shapes', () => {
  const where_state = createParserState(
    "{ MATCH (n)-[:TRACKED_IN]->(task:Task) WHERE task.status = 'ready' }",
  );
  where_state.root_variable_name = 'n';

  expect(
    parseSubqueryAggregate(where_state, 1, 'count', (parser_state) => {
      parser_state.index = parser_state.tokens.length - 1;
      return {
        expression: createAlwaysTrueExpression(99),
        success: true,
      };
    }),
  ).toEqual({
    success: true,
    term: {
      aggregate_name: 'count',
      expression: {
        expressions: [
          {
            kind: 'term',
            term: {
              column: 28,
              field_name: '$class',
              kind: 'field',
              operator: '=',
              value: 'task',
            },
          },
          createAlwaysTrueExpression(99),
        ],
        kind: 'and',
      },
      kind: 'aggregate',
      traversal: {
        column: 12,
        direction: 'out',
        relation_name: 'tracked_in',
      },
    },
  });

  const invalid_shape_state = createParserState(
    '{ MATCH (plan)-[:TRACKED_IN]->(task) }',
  );
  invalid_shape_state.root_variable_name = 'n';

  expect(
    parseSubqueryAggregate(invalid_shape_state, 1, 'any', createBooleanStub()),
  ).toEqual({
    diagnostic: {
      code: 'query.invalid',
      column: 38,
      level: 'error',
      line: 1,
      message:
        'Cypher subqueries must traverse to or from the root MATCH variable.',
      path: '<query>',
    },
    success: false,
  });
});

it('throws for malformed cypher patterns', () => {
  expect(() => parseNodePattern(createParserState('(n foo)'))).toThrow(
    'Unexpected token while parsing a node pattern.',
  );
  expect(() =>
    parseSubqueryAggregate(
      createRootlessState('{ MATCH (n)-[:TRACKED_IN]->(task) }'),
      1,
      'any',
      createBooleanStub(),
    ),
  ).toThrow('Expected a root query variable.');
  expect(() =>
    parseSubqueryAggregate(
      createRootlessState('{ MATCH (n)=[:TRACKED_IN]->(task) }'),
      1,
      'any',
      createBooleanStub(),
    ),
  ).toThrow('Expected a relationship direction.');
  expect(() => parseCypherScalarValue(createParserState(')'))).toThrow(
    'Expected a scalar value.',
  );
});

/**
 * @returns {(parser_state: CypherParserState) => { expression: ParsedExpression, success: true }}
 */
function createBooleanStub() {
  return () => ({
    expression: createAlwaysTrueExpression(1),
    success: true,
  });
}

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
    index: 0,
    query_text,
    repo_config,
    root_variable_name: null,
    tokens: tokenize_result.tokens,
  };
}

/**
 * @param {string} query_text
 * @returns {CypherParserState}
 */
function createRootlessState(query_text) {
  return {
    ...createParserState(query_text),
    root_variable_name: null,
  };
}
