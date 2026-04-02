/**
 * @import { PatramDiagnostic, PatramRepoConfig } from '../../config/load-patram-config.types.ts';
 * @import {
 *   ParsedAggregateComparison,
 *   ParsedExpression,
 *   ParsedFieldTerm,
 *   ParsedTerm,
 * } from '../parse-where-clause.types.ts';
 * @import { CypherNodePattern } from './cypher.types.ts';
 */

/** @type {Record<string, string>} */
const QUERY_FIELD_NAME_MAP = {
  class: '$class',
  filename: '$filename',
  id: '$id',
  path: '$path',
};

/**
 * @param {string} query_text
 * @returns {boolean}
 */
export function looksLikeCypher(query_text) {
  return /^\s*MATCH\b/u.test(query_text);
}

/**
 * @param {number} column
 * @param {string} message
 * @returns {{ diagnostic: PatramDiagnostic, success: false }}
 */
export function fail(column, message) {
  return {
    diagnostic: {
      code: 'query.invalid',
      column,
      level: 'error',
      line: 1,
      message,
      path: '<query>',
    },
    success: false,
  };
}

/**
 * @param {string} field_name
 * @returns {string}
 */
export function resolveQueryFieldName(field_name) {
  return QUERY_FIELD_NAME_MAP[field_name] ?? field_name;
}

/**
 * @param {string} relation_name
 * @returns {string}
 */
function relationNameToType(relation_name) {
  return relation_name.toUpperCase();
}

/**
 * @param {string} relation_type
 * @returns {string}
 */
export function relationTypeToRelationName(relation_type) {
  return relation_type.toLowerCase();
}

/**
 * @param {string} value
 * @returns {string}
 */
function toPascalCase(value) {
  return value
    .split('_')
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join('');
}

/**
 * @param {string} value
 * @returns {string}
 */
function toLowerSnakeCase(value) {
  return value
    .replace(/([a-z0-9])([A-Z])/gu, '$1_$2')
    .replace(/[\s-]+/gu, '_')
    .toLowerCase();
}

/**
 * @param {string} value
 * @returns {value is ParsedAggregateComparison}
 */
export function isAggregateComparison(value) {
  return ['!=', '<', '<=', '=', '>', '>='].includes(value);
}

/**
 * @param {PatramRepoConfig | null} repo_config
 * @returns {{
 *   labels: string[],
 *   propertyKeys: string[],
 *   relationshipTypes: string[],
 * }}
 */
export function createCypherDbSchema(repo_config) {
  return {
    labels: collectSchemaLabels(repo_config),
    propertyKeys: collectSchemaPropertyKeys(repo_config),
    relationshipTypes: collectSchemaRelationshipTypes(repo_config),
  };
}

/**
 * @param {CypherNodePattern} node_pattern
 * @param {PatramRepoConfig | null} repo_config
 * @returns {ParsedExpression | null}
 */
export function createNodeLabelExpression(node_pattern, repo_config) {
  if (!node_pattern.label_name) {
    return null;
  }

  return {
    kind: 'term',
    term: createFieldTerm(
      '$class',
      '=',
      resolveClassName(node_pattern.label_name, repo_config),
      node_pattern.column,
    ),
  };
}

/**
 * @param {string} field_name
 * @param {ParsedFieldTerm['operator']} operator
 * @param {string} value
 * @param {number} column
 * @returns {{ success: true, expression: ParsedExpression }}
 */
export function createFieldExpression(field_name, operator, value, column) {
  return {
    expression: {
      kind: 'term',
      term: createFieldTerm(field_name, operator, value, column),
    },
    success: true,
  };
}

/**
 * @param {string} field_name
 * @param {'in' | 'not in'} operator
 * @param {string[]} values
 * @param {number} column
 * @returns {{ success: true, expression: ParsedExpression }}
 */
export function createFieldSetExpression(field_name, operator, values, column) {
  return {
    expression: {
      kind: 'term',
      term: {
        column,
        field_name,
        kind: 'field_set',
        operator,
        values,
      },
    },
    success: true,
  };
}

/**
 * @param {number} column
 * @returns {ParsedExpression}
 */
export function createAlwaysTrueExpression(column) {
  return {
    kind: 'term',
    term: createFieldTerm('$id', '^=', '', column),
  };
}

/**
 * @param {ParsedExpression[]} expressions
 * @returns {ParsedExpression}
 */
export function collapseAndExpressions(expressions) {
  return collapseBooleanExpression('and', expressions);
}

/**
 * @param {'and' | 'or'} kind
 * @param {ParsedExpression[]} expressions
 * @returns {ParsedExpression}
 */
export function collapseBooleanExpression(kind, expressions) {
  if (expressions.length === 0) {
    return createAlwaysTrueExpression(1);
  }

  if (expressions.length === 1) {
    return expressions[0];
  }

  return {
    expressions,
    kind,
  };
}

/**
 * @param {PatramRepoConfig | null} repo_config
 * @returns {string[]}
 */
function collectSchemaLabels(repo_config) {
  /** @type {Set<string>} */
  const labels = new Set(['Document']);

  for (const [class_name, class_definition] of Object.entries(
    repo_config?.classes ?? {},
  )) {
    labels.add(class_definition.label ?? toPascalCase(class_name));
  }

  return [...labels];
}

/**
 * @param {PatramRepoConfig | null} repo_config
 * @returns {string[]}
 */
function collectSchemaPropertyKeys(repo_config) {
  /** @type {Set<string>} */
  const property_keys = new Set([
    'class',
    'filename',
    'id',
    'kind',
    'path',
    'title',
  ]);

  for (const field_name of Object.keys(repo_config?.fields ?? {})) {
    property_keys.add(field_name);
  }

  return [...property_keys];
}

/**
 * @param {PatramRepoConfig | null} repo_config
 * @returns {string[]}
 */
function collectSchemaRelationshipTypes(repo_config) {
  return Object.keys(repo_config?.relations ?? {}).map(relationNameToType);
}

/**
 * @param {string} label_name
 * @param {PatramRepoConfig | null} repo_config
 * @returns {string}
 */
function resolveClassName(label_name, repo_config) {
  for (const [class_name, class_definition] of Object.entries(
    repo_config?.classes ?? {},
  )) {
    if (
      class_definition.label === label_name ||
      class_name === label_name ||
      toPascalCase(class_name) === label_name
    ) {
      return class_name;
    }
  }

  return toLowerSnakeCase(label_name);
}

/**
 * @param {string} field_name
 * @param {ParsedFieldTerm['operator']} operator
 * @param {string} value
 * @param {number} column
 * @returns {ParsedTerm}
 */
function createFieldTerm(field_name, operator, value, column) {
  return {
    column,
    field_name,
    kind: 'field',
    operator,
    value,
  };
}
