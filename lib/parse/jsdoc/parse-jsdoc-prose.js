/**
 * @import { PatramClaimFields } from '../parse-claims.types.ts';
 */

const JSDOC_SENTENCE_PATTERN = /^(.+?[.!?])(?:\s+|$)([\s\S]*)$/du;
const JSDOC_TITLE_LENGTH_LIMIT = 120;

/**
 * @param {Array<Array<{ column: number, content: string, line: number }>>} prose_paragraphs
 * @param {Array<{ column: number, content: string, line: number }>} paragraph_lines
 */
export function pushJsdocParagraph(prose_paragraphs, paragraph_lines) {
  if (paragraph_lines.length > 0) {
    prose_paragraphs.push(paragraph_lines);
  }
}

/**
 * @param {string} file_path
 * @param {Array<Array<{ column: number, content: string, line: number }>>} prose_paragraphs
 * @returns {Array<{ claim_fields: PatramClaimFields, claim_type: string, order: number }>}
 */
export function createJsdocProseClaimEntries(file_path, prose_paragraphs) {
  if (prose_paragraphs.length === 0) {
    return [];
  }

  const first_paragraph = prose_paragraphs[0];
  const first_origin = {
    column: first_paragraph[0].column,
    line: first_paragraph[0].line,
    path: file_path,
  };
  const title_result = splitJsdocParagraphTitle(
    first_paragraph.map((line) => line.content).join(' '),
  );
  /** @type {Array<{ claim_fields: PatramClaimFields, claim_type: string, order: number }>} */
  const claim_entries = [
    {
      claim_fields: {
        origin: first_origin,
        value: title_result.title,
      },
      claim_type: 'document.title',
      order: 0,
    },
  ];
  /** @type {string[]} */
  const description_parts = [];
  /** @type {{ column: number, line: number, path: string } | null} */
  let description_origin = null;

  if (title_result.remainder.length > 0) {
    description_parts.push(title_result.remainder);
    description_origin = first_origin;
  }

  for (const paragraph_lines of prose_paragraphs.slice(1)) {
    if (description_origin === null) {
      description_origin = {
        column: paragraph_lines[0].column,
        line: paragraph_lines[0].line,
        path: file_path,
      };
    }

    description_parts.push(
      paragraph_lines.map((line) => line.content).join(' '),
    );
  }

  if (description_origin && description_parts.length > 0) {
    claim_entries.push({
      claim_fields: {
        origin: description_origin,
        value: description_parts.join('\n\n'),
      },
      claim_type: 'document.description',
      order: 1,
    });
  }

  return claim_entries;
}

/**
 * @param {string} paragraph_text
 * @returns {{ remainder: string, title: string }}
 */
function splitJsdocParagraphTitle(paragraph_text) {
  if (paragraph_text.length <= JSDOC_TITLE_LENGTH_LIMIT) {
    return {
      remainder: '',
      title: paragraph_text,
    };
  }

  const sentence_match = paragraph_text.match(JSDOC_SENTENCE_PATTERN);

  if (!sentence_match) {
    return {
      remainder: '',
      title: paragraph_text,
    };
  }

  return {
    remainder: sentence_match[2].trim(),
    title: sentence_match[1].trim(),
  };
}
