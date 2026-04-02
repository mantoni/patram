/**
 * @import { OutputStoredQueryItem } from './output-view.types.ts';
 */

/**
 * @typedef {'description' | 'field_name' | 'keyword' | 'literal' | 'name' | 'operator' | 'plain'} StoredQuerySegmentKind
 */

/**
 * @typedef {{ kind: StoredQuerySegmentKind, text: string }} StoredQuerySegment
 */

/**
 * @param {string} where_clause
 * @param {number} first_line_width
 * @param {number} continuation_width
 * @returns {StoredQuerySegment[][]}
 */
export function layoutStoredQueryRow(
  where_clause,
  first_line_width,
  continuation_width,
) {
  return wrapPhrasesWithLineWidths(
    createStoredQueryPhrases(where_clause),
    first_line_width,
    continuation_width,
  );
}

/**
 * @param {string} where_clause
 * @returns {StoredQuerySegment[][]}
 */
function createStoredQueryPhrases(where_clause) {
  return createFallbackPhrases(where_clause);
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
 * @param {number} first_line_width
 * @param {number} continuation_width
 * @returns {StoredQuerySegment[][]}
 */
function wrapPhrasesWithLineWidths(
  phrases,
  first_line_width,
  continuation_width,
) {
  /** @type {StoredQuerySegment[][]} */
  const lines = [];
  /** @type {StoredQuerySegment[]} */
  let current_line = [];
  let current_width = 0;
  let current_line_width = first_line_width;

  for (const phrase of phrases) {
    const phrase_width = measureSegments(phrase);

    if (current_line.length === 0) {
      current_line = [...phrase];
      current_width = phrase_width;
      continue;
    }

    if (current_width + 1 + phrase_width > current_line_width) {
      lines.push(current_line);
      current_line = [...phrase];
      current_width = phrase_width;
      current_line_width = continuation_width;
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
