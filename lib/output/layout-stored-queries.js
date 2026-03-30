/* eslint-disable max-lines */
/**
 * @import { OutputStoredQueryItem } from './output-view.types.ts';
 */

import { parseWhereClause } from '../graph/query/parse.js';

const MAX_STORED_QUERY_WIDTH = 100;
const MIN_TERM_COLUMN_WIDTH = 20;
const STORED_QUERY_COLUMN_GAP = 2;

/**
 * @typedef {'description' | 'field_name' | 'keyword' | 'literal' | 'name' | 'operator' | 'plain'} StoredQuerySegmentKind
 */

/**
 * @typedef {{ kind: StoredQuerySegmentKind, text: string }} StoredQuerySegment
 */

/**
 * Layout stored queries into styled lines shared by plain and rich renderers.
 *
 * @param {OutputStoredQueryItem[]} output_items
 * @returns {StoredQuerySegment[][]}
 */
export function layoutStoredQueries(output_items) {
  if (output_items.length === 0) {
    return [];
  }

  const name_column_width = Math.max(
    ...output_items.map((output_item) => output_item.name.length),
  );
  const term_column_width = Math.max(
    MIN_TERM_COLUMN_WIDTH,
    MAX_STORED_QUERY_WIDTH - name_column_width - STORED_QUERY_COLUMN_GAP,
  );

  return output_items.flatMap((output_item) =>
    layoutStoredQuery(output_item, name_column_width, term_column_width),
  );
}

/**
 * @param {OutputStoredQueryItem} output_item
 * @param {number} name_column_width
 * @param {number} term_column_width
 * @returns {StoredQuerySegment[][]}
 */
function layoutStoredQuery(output_item, name_column_width, term_column_width) {
  const term_lines = wrapPhrases(
    createStoredQueryPhrases(output_item.where),
    term_column_width,
  );
  const continuation_prefix = ' '.repeat(
    name_column_width + STORED_QUERY_COLUMN_GAP,
  );

  /** @type {StoredQuerySegment[][]} */
  const output_lines = term_lines.map((line_segments, line_index) => {
    if (line_index === 0) {
      return [
        {
          kind: 'name',
          text: output_item.name.padEnd(name_column_width, ' '),
        },
        {
          kind: 'plain',
          text: ' '.repeat(STORED_QUERY_COLUMN_GAP),
        },
        ...line_segments,
      ];
    }

    return [
      {
        kind: 'plain',
        text: continuation_prefix,
      },
      ...line_segments,
    ];
  });

  if (output_item.description) {
    for (const description_line of output_item.description.split('\n')) {
      output_lines.push([
        {
          kind: 'description',
          text: `${' '.repeat(name_column_width + STORED_QUERY_COLUMN_GAP)}${description_line}`,
        },
      ]);
    }
  }

  output_lines.push([]);

  return output_lines;
}

/**
 * @param {string} where_clause
 * @returns {StoredQuerySegment[][]}
 */
function createStoredQueryPhrases(where_clause) {
  const parse_result = parseWhereClause(where_clause);

  if (!parse_result.success) {
    return createFallbackPhrases(where_clause);
  }

  return createExpressionPhrases(parse_result.expression);
}

/**
 * @param {import('../graph/parse-where-clause.types.ts').ParsedExpression} expression
 * @returns {StoredQuerySegment[][]}
 */
function createExpressionPhrases(expression) {
  if (expression.kind !== 'and' && expression.kind !== 'or') {
    return [[...createExpressionSegments(expression, 0)]];
  }

  return expression.expressions.map((subexpression, expression_index) =>
    createExpressionPhrase(
      subexpression,
      expression.kind,
      expression_index > 0,
    ),
  );
}

/**
 * @param {import('../graph/parse-where-clause.types.ts').ParsedExpression} expression
 * @param {'and' | 'or'} operator
 * @param {boolean} should_prefix_operator
 * @returns {StoredQuerySegment[]}
 */
function createExpressionPhrase(expression, operator, should_prefix_operator) {
  /** @type {StoredQuerySegment[]} */
  const phrase = [];

  if (should_prefix_operator) {
    phrase.push({ kind: 'keyword', text: operator });
    phrase.push({ kind: 'plain', text: ' ' });
  }

  phrase.push(
    ...createExpressionSegments(
      expression,
      getBooleanExpressionPrecedence(operator),
    ),
  );

  return phrase;
}

/**
 * @param {import('../graph/parse-where-clause.types.ts').ParsedExpression} expression
 * @param {number} parent_precedence
 * @returns {StoredQuerySegment[]}
 */
function createExpressionSegments(expression, parent_precedence) {
  const expression_precedence = getExpressionPrecedence(expression);
  const expression_segments = createRawExpressionSegments(expression);

  if (expression_precedence >= parent_precedence) {
    return expression_segments;
  }

  return [
    { kind: 'operator', text: '(' },
    ...expression_segments,
    { kind: 'operator', text: ')' },
  ];
}

/**
 * @param {import('../graph/parse-where-clause.types.ts').ParsedExpression} expression
 * @returns {StoredQuerySegment[]}
 */
function createRawExpressionSegments(expression) {
  if (expression.kind === 'and' || expression.kind === 'or') {
    return expression.expressions.flatMap((subexpression, expression_index) => {
      const subexpression_segments = createExpressionSegments(
        subexpression,
        getExpressionPrecedence(expression),
      );

      if (expression_index === 0) {
        return subexpression_segments;
      }

      return [
        { kind: 'plain', text: ' ' },
        { kind: 'keyword', text: expression.kind },
        { kind: 'plain', text: ' ' },
        ...subexpression_segments,
      ];
    });
  }

  if (expression.kind === 'not') {
    return [
      { kind: 'keyword', text: 'not' },
      { kind: 'plain', text: ' ' },
      ...createExpressionSegments(
        expression.expression,
        getExpressionPrecedence(expression),
      ),
    ];
  }

  if (expression.kind === 'term') {
    return createTermSegments(expression.term);
  }

  throw new Error('Unsupported stored-query expression.');
}

/**
 * @param {import('../graph/parse-where-clause.types.ts').ParsedExpression} expression
 * @returns {number}
 */
function getExpressionPrecedence(expression) {
  if (expression.kind === 'or') {
    return 1;
  }

  if (expression.kind === 'and') {
    return 2;
  }

  if (expression.kind === 'not') {
    return 3;
  }

  return 4;
}

/**
 * @param {'and' | 'or'} operator
 * @returns {number}
 */
function getBooleanExpressionPrecedence(operator) {
  return operator === 'or' ? 1 : 2;
}

/**
 * @param {import('../graph/parse-where-clause.types.ts').ParsedTerm} term
 * @returns {StoredQuerySegment[]}
 */
function createTermSegments(term) {
  if (term.kind === 'aggregate') {
    return createAggregateSegments(term);
  }

  if (term.kind === 'field') {
    return [
      { kind: 'field_name', text: term.field_name },
      { kind: 'operator', text: term.operator },
      { kind: 'literal', text: term.value },
    ];
  }

  if (term.kind === 'field_set') {
    return createFieldSetSegments(term);
  }

  if (term.kind === 'relation_target') {
    return [
      { kind: 'field_name', text: term.relation_name },
      { kind: 'operator', text: '=' },
      { kind: 'literal', text: term.target_id },
    ];
  }

  return [
    { kind: 'field_name', text: term.relation_name },
    { kind: 'operator', text: ':*' },
  ];
}

/**
 * @param {import('../graph/parse-where-clause.types.ts').ParsedFieldSetTerm} term
 * @returns {StoredQuerySegment[]}
 */
function createFieldSetSegments(term) {
  return [
    { kind: 'field_name', text: term.field_name },
    { kind: 'plain', text: ' ' },
    { kind: 'operator', text: term.operator },
    { kind: 'plain', text: ' ' },
    { kind: 'operator', text: '[' },
    ...createListSegments(term.values),
    { kind: 'operator', text: ']' },
  ];
}

/**
 * @param {import('../graph/parse-where-clause.types.ts').ParsedAggregateTerm} term
 * @returns {StoredQuerySegment[]}
 */
function createAggregateSegments(term) {
  /** @type {StoredQuerySegment[]} */
  const segments = [
    { kind: 'field_name', text: term.aggregate_name },
    { kind: 'operator', text: '(' },
    ...createTraversalSegments(term.traversal),
    { kind: 'operator', text: ', ' },
    ...createExpressionSegments(term.expression, 0),
    { kind: 'operator', text: ')' },
  ];

  if (term.aggregate_name === 'count') {
    segments.push({ kind: 'plain', text: ' ' });
    segments.push({ kind: 'operator', text: term.comparison ?? '=' });
    segments.push({ kind: 'plain', text: ' ' });
    segments.push({ kind: 'literal', text: String(term.value ?? 0) });
  }

  return segments;
}

/**
 * @param {{ direction: 'in' | 'out', relation_name: string }} traversal
 * @returns {StoredQuerySegment[]}
 */
function createTraversalSegments(traversal) {
  return [
    { kind: 'field_name', text: traversal.direction },
    { kind: 'operator', text: ':' },
    { kind: 'field_name', text: traversal.relation_name },
  ];
}

/**
 * @param {string[]} values
 * @returns {StoredQuerySegment[]}
 */
function createListSegments(values) {
  return values.flatMap((value, value_index) => {
    if (value_index === 0) {
      return [{ kind: 'literal', text: value }];
    }

    return [
      { kind: 'operator', text: ', ' },
      { kind: 'literal', text: value },
    ];
  });
}

/**
 * @param {string} where_clause
 * @returns {StoredQuerySegment[][]}
 */
function createFallbackPhrases(where_clause) {
  const tokens = where_clause.match(/\S+/gu) ?? [];

  if (tokens.length === 0) {
    return [[{ kind: 'literal', text: where_clause }]];
  }

  return tokens.map((token) => [{ kind: 'literal', text: token }]);
}

/**
 * @param {StoredQuerySegment[][]} phrases
 * @param {number} term_column_width
 * @returns {StoredQuerySegment[][]}
 */
function wrapPhrases(phrases, term_column_width) {
  /** @type {StoredQuerySegment[][]} */
  const lines = [];
  /** @type {StoredQuerySegment[]} */
  let current_line = [];
  let current_width = 0;

  for (const phrase of phrases) {
    const phrase_width = measureSegments(phrase);

    if (current_line.length === 0) {
      current_line = [...phrase];
      current_width = phrase_width;
      continue;
    }

    if (current_width + 1 + phrase_width > term_column_width) {
      lines.push(current_line);
      current_line = [...phrase];
      current_width = phrase_width;
      continue;
    }

    current_line.push({ kind: 'plain', text: ' ' });
    current_line.push(...phrase);
    current_width += 1 + phrase_width;
  }

  if (current_line.length > 0) {
    lines.push(current_line);
  }

  return lines;
}

/**
 * @param {StoredQuerySegment[]} segments
 * @returns {number}
 */
function measureSegments(segments) {
  return segments.reduce(
    (total_width, segment) => total_width + segment.text.length,
    0,
  );
}
