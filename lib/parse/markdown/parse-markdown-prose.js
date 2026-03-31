import {
  matchHiddenDirectiveFields,
  matchVisibleDirectiveFields,
} from './parse-markdown-directives.js';

const HEADING_PATTERN = /^#{1,6}\s+(.+)$/du;
const BLOCKQUOTE_PATTERN = /^\s*>/u;
const INDENTED_CODE_PATTERN = /^(?: {4}|\t)\S/u;
const MARKDOWN_DESCRIPTION_SENTENCE_PATTERN = /^(.+?[.!?])(?:\s+|$)[\s\S]*$/du;
const MARKDOWN_DESCRIPTION_LENGTH_LIMIT = 120;
const MARKDOWN_FENCE_PATTERN = /^([`~]{3,})/du;
const MARKDOWN_ORDERED_LIST_PATTERN = /^\s*\d+[.)]\s+/u;
const MARKDOWN_TABLE_PATTERN = /^\s*\|/u;
const MARKDOWN_UNORDERED_LIST_PATTERN = /^\s*[-+*]\s+/u;

/**
 * @param {string[]} lines
 * @param {number} start_line_index
 * @returns {{ is_heading: boolean, line: number, line_index: number, value: string } | null}
 */
export function getMarkdownTitle(lines, start_line_index) {
  const first_line_index = skipBlankLines(lines, start_line_index);
  const first_line = lines[first_line_index];

  if (first_line === undefined) {
    return null;
  }

  const trimmed_line = first_line.trim();
  const heading_match = trimmed_line.match(HEADING_PATTERN);

  if (heading_match) {
    return {
      is_heading: true,
      line: first_line_index + 1,
      line_index: first_line_index,
      value: heading_match[1].trim(),
    };
  }

  return {
    is_heading: false,
    line: first_line_index + 1,
    line_index: first_line_index,
    value: trimmed_line,
  };
}

/**
 * @param {string} file_path
 * @param {string[]} lines
 * @param {{ is_heading: boolean, line: number, line_index: number, value: string } | null} title_result
 * @returns {{ column: number, line: number, value: string } | null}
 */
export function getMarkdownDescription(file_path, lines, title_result) {
  if (!title_result) {
    return null;
  }

  let line_index = title_result.is_heading
    ? title_result.line_index + 1
    : title_result.line_index;

  line_index = skipBlankLines(lines, line_index);

  if (line_index >= lines.length) {
    return null;
  }

  if (
    title_result.is_heading &&
    isMarkdownDirectiveLine(file_path, lines, line_index)
  ) {
    line_index = skipMarkdownDirectiveBlock(file_path, lines, line_index);
    line_index = skipBlankLines(lines, line_index);
  }

  const paragraph_result = collectMarkdownParagraph(lines, line_index);

  if (!paragraph_result) {
    return null;
  }

  return {
    column: paragraph_result.column,
    line: paragraph_result.line,
    value: summarizeMarkdownParagraph(paragraph_result.value),
  };
}

/**
 * @param {string[]} lines
 * @param {number} line_index
 * @returns {{ column: number, line: number, value: string } | null}
 */
function collectMarkdownParagraph(lines, line_index) {
  const first_line = lines[line_index];

  if (first_line === undefined || !isMarkdownParagraphLine(first_line)) {
    return null;
  }

  const paragraph_lines = [first_line.trim()];
  let next_line_index = line_index + 1;

  while (next_line_index < lines.length) {
    const next_line = lines[next_line_index];

    if (next_line.trim().length === 0 || !isMarkdownParagraphLine(next_line)) {
      break;
    }

    paragraph_lines.push(next_line.trim());
    next_line_index += 1;
  }

  return {
    column: getLineColumn(first_line),
    line: line_index + 1,
    value: paragraph_lines.join(' '),
  };
}

/**
 * @param {string} file_path
 * @param {string[]} lines
 * @param {number} line_index
 * @returns {boolean}
 */
function isMarkdownDirectiveLine(file_path, lines, line_index) {
  const line = lines[line_index];
  const line_number = line_index + 1;

  return (
    matchVisibleDirectiveFields(file_path, line, line_number) !== null ||
    matchHiddenDirectiveFields(file_path, line, line_number) !== null
  );
}

/**
 * @param {string} file_path
 * @param {string[]} lines
 * @param {number} line_index
 * @returns {number}
 */
function skipMarkdownDirectiveBlock(file_path, lines, line_index) {
  let next_line_index = line_index;

  while (next_line_index < lines.length) {
    const line = lines[next_line_index];

    if (line.trim().length === 0) {
      next_line_index += 1;
      continue;
    }

    if (!isMarkdownDirectiveLine(file_path, lines, next_line_index)) {
      break;
    }

    next_line_index += 1;
  }

  return next_line_index;
}

/**
 * @param {string} line
 * @returns {number}
 */
function getLineColumn(line) {
  const first_character_index = line.search(/\S/u);

  return first_character_index < 0 ? 1 : first_character_index + 1;
}

/**
 * @param {string} paragraph_text
 * @returns {string}
 */
function summarizeMarkdownParagraph(paragraph_text) {
  if (paragraph_text.length <= MARKDOWN_DESCRIPTION_LENGTH_LIMIT) {
    return paragraph_text;
  }

  const sentence_match = paragraph_text.match(
    MARKDOWN_DESCRIPTION_SENTENCE_PATTERN,
  );

  if (!sentence_match) {
    return paragraph_text;
  }

  return sentence_match[1].trim();
}

/**
 * @param {string} line
 * @returns {boolean}
 */
function isMarkdownParagraphLine(line) {
  const trimmed_line = line.trim();

  if (trimmed_line.length === 0) {
    return false;
  }

  return !(
    HEADING_PATTERN.test(trimmed_line) ||
    MARKDOWN_FENCE_PATTERN.test(trimmed_line) ||
    MARKDOWN_ORDERED_LIST_PATTERN.test(line) ||
    MARKDOWN_TABLE_PATTERN.test(line) ||
    MARKDOWN_UNORDERED_LIST_PATTERN.test(line) ||
    BLOCKQUOTE_PATTERN.test(line) ||
    INDENTED_CODE_PATTERN.test(line)
  );
}

/**
 * @param {string[]} lines
 * @param {number} start_line_index
 * @returns {number}
 */
function skipBlankLines(lines, start_line_index) {
  let line_index = start_line_index;

  while (line_index < lines.length && lines[line_index].trim().length === 0) {
    line_index += 1;
  }

  return line_index;
}
