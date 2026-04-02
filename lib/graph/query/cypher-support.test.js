/**
 * @import { PatramRepoConfig } from '../../config/load-patram-config.types.ts';
 */

/* eslint-disable max-lines-per-function */
import { expect, it } from 'vitest';

import {
  collapseAndExpressions,
  collapseBooleanExpression,
  createAlwaysTrueExpression,
  createCypherDbSchema,
  createFieldExpression,
  createFieldSetExpression,
  createNodeLabelExpression,
  fail,
  isAggregateComparison,
  looksLikeCypher,
  relationTypeToRelationName,
  resolveQueryFieldName,
} from './cypher-support.js';

/** @type {PatramRepoConfig} */
const REPO_CONFIG = {
  classes: {
    decision: {
      label: 'Decision',
    },
    task: {
      label: 'Task',
    },
  },
  fields: {
    owner: {
      type: 'string',
    },
  },
  include: ['**/*'],
  queries: {},
  relations: {
    tracked_in: {
      from: ['task'],
      to: ['decision'],
    },
  },
};

it('builds cypher support helpers', () => {
  expect(looksLikeCypher('MATCH (n) RETURN n')).toBe(true);
  expect(looksLikeCypher('status=ready')).toBe(false);
  expect(resolveQueryFieldName('class')).toBe('$class');
  expect(resolveQueryFieldName('status')).toBe('status');
  expect(relationTypeToRelationName('TRACKED_IN')).toBe('tracked_in');
  expect(isAggregateComparison('>=')).toBe(true);
  expect(isAggregateComparison('in')).toBe(false);
  expect(fail(3, 'Broken query.')).toEqual({
    diagnostic: {
      code: 'query.invalid',
      column: 3,
      level: 'error',
      line: 1,
      message: 'Broken query.',
      path: '<query>',
    },
    success: false,
  });
});

it('creates schema and field expressions', () => {
  expect(createCypherDbSchema(REPO_CONFIG)).toEqual({
    labels: ['Document', 'Decision', 'Task'],
    propertyKeys: ['class', 'filename', 'id', 'kind', 'path', 'title', 'owner'],
    relationshipTypes: ['TRACKED_IN'],
  });

  expect(createFieldExpression('status', '=', 'ready', 4)).toEqual({
    expression: {
      kind: 'term',
      term: {
        column: 4,
        field_name: 'status',
        kind: 'field',
        operator: '=',
        value: 'ready',
      },
    },
    success: true,
  });

  expect(createFieldSetExpression('status', 'in', ['ready'], 5)).toEqual({
    expression: {
      kind: 'term',
      term: {
        column: 5,
        field_name: 'status',
        kind: 'field_set',
        operator: 'in',
        values: ['ready'],
      },
    },
    success: true,
  });

  expect(createAlwaysTrueExpression(7)).toEqual({
    kind: 'term',
    term: {
      column: 7,
      field_name: '$id',
      kind: 'field',
      operator: '^=',
      value: '',
    },
  });
});

it('maps labels and collapses boolean expressions', () => {
  expect(
    createNodeLabelExpression(
      {
        column: 8,
        label_name: 'Task',
        variable_name: 'n',
      },
      REPO_CONFIG,
    ),
  ).toEqual({
    kind: 'term',
    term: {
      column: 8,
      field_name: '$class',
      kind: 'field',
      operator: '=',
      value: 'task',
    },
  });

  expect(
    createNodeLabelExpression(
      {
        column: 9,
        label_name: 'ReleasePlan',
        variable_name: 'n',
      },
      REPO_CONFIG,
    ),
  ).toEqual({
    kind: 'term',
    term: {
      column: 9,
      field_name: '$class',
      kind: 'field',
      operator: '=',
      value: 'release_plan',
    },
  });
  expect(
    createNodeLabelExpression(
      {
        column: 10,
        label_name: null,
        variable_name: 'n',
      },
      REPO_CONFIG,
    ),
  ).toBeNull();

  const expression = createAlwaysTrueExpression(2);

  expect(collapseAndExpressions([])).toEqual(createAlwaysTrueExpression(1));
  expect(collapseBooleanExpression('or', [expression])).toBe(expression);
  expect(collapseBooleanExpression('and', [expression, expression])).toEqual({
    expressions: [expression, expression],
    kind: 'and',
  });
});
