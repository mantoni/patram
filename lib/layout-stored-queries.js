/**
 * @import { OutputStoredQueryItem } from './output-view.types.ts';
 */

import { parseWhereClause } from './parse-where-clause.js';

const MAX_STORED_QUERY_WIDTH = 100;
const MIN_TERM_COLUMN_WIDTH = 20;
const STORED_QUERY_COLUMN_GAP = 2;

/**
 * @typedef {'field_name' | 'keyword' | 'literal' | 'name' | 'operator' | 'plain'} StoredQuerySegmentKind
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

  return term_lines.map((line_segments, line_index) => {
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

  return parse_result.clauses.map((clause, clause_index) =>
    createClausePhrase(clause, clause_index > 0),
  );
}

/**
 * @param {{ is_negated: boolean, term: { kind: 'field', field_name: 'id' | 'kind' | 'path' | 'status' | 'title', operator: '=' | '^=' | '~', value: string } | { kind: 'relation', relation_name: string } | { kind: 'relation_target', relation_name: string, target_id: string } }} clause
 * @param {boolean} should_prefix_and
 * @returns {StoredQuerySegment[]}
 */
function createClausePhrase(clause, should_prefix_and) {
  /** @type {StoredQuerySegment[]} */
  const phrase = [];

  if (should_prefix_and) {
    phrase.push({ kind: 'keyword', text: 'and' });
    phrase.push({ kind: 'plain', text: ' ' });
  }

  if (clause.is_negated) {
    phrase.push({ kind: 'keyword', text: 'not' });
    phrase.push({ kind: 'plain', text: ' ' });
  }

  phrase.push(...createTermSegments(clause.term));

  return phrase;
}

/**
 * @param {{ kind: 'field', field_name: 'id' | 'kind' | 'path' | 'status' | 'title', operator: '=' | '^=' | '~', value: string } | { kind: 'relation', relation_name: string } | { kind: 'relation_target', relation_name: string, target_id: string }} term
 * @returns {StoredQuerySegment[]}
 */
function createTermSegments(term) {
  if (term.kind === 'field') {
    return [
      { kind: 'field_name', text: term.field_name },
      { kind: 'operator', text: term.operator },
      { kind: 'literal', text: term.value },
    ];
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
