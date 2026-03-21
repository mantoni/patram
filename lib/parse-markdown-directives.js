/**
 * @import { PatramClaimFields } from './parse-claims.types.ts';
 */

const FRONT_MATTER_BOUNDARY_PATTERN = /^---$/du;
const FRONT_MATTER_DIRECTIVE_PATTERN = /^([A-Za-z][A-Za-z0-9 _-]*):\s+(.+)$/du;
const MARKDOWN_HIDDEN_DIRECTIVE_PATTERN =
  /^\[patram\s+([A-Za-z][A-Za-z0-9 _-]*)=(.+)\]:\s*#\s*$/du;
const VISIBLE_DIRECTIVE_PATTERN = /^(?:-\s+)?([A-Z][A-Za-z _-]*):\s+(.+)$/du;

/**
 * @param {string} file_path
 * @param {string[]} lines
 * @returns {{ body_start: number, directive_fields: PatramClaimFields[] }}
 */
export function parseFrontMatterDirectiveFields(file_path, lines) {
  if (lines[0] !== '---') {
    return {
      body_start: 0,
      directive_fields: [],
    };
  }

  const closing_line_index = findFrontMatterClosingLineIndex(lines);

  if (closing_line_index < 0) {
    return {
      body_start: 0,
      directive_fields: [],
    };
  }

  /** @type {PatramClaimFields[]} */
  const directive_fields = [];

  for (let line_index = 1; line_index < closing_line_index; line_index += 1) {
    const directive_fields_match = matchDirectiveFields(
      FRONT_MATTER_DIRECTIVE_PATTERN,
      file_path,
      lines[line_index],
      line_index + 1,
    );

    if (!directive_fields_match) {
      continue;
    }

    directive_fields.push(directive_fields_match);
  }

  return {
    body_start: closing_line_index + 1,
    directive_fields,
  };
}

/**
 * @param {string} file_path
 * @param {string} line
 * @param {number} line_number
 * @returns {PatramClaimFields | null}
 */
export function matchVisibleDirectiveFields(file_path, line, line_number) {
  return matchDirectiveFields(
    VISIBLE_DIRECTIVE_PATTERN,
    file_path,
    line,
    line_number,
  );
}

/**
 * @param {string} file_path
 * @param {string} line
 * @param {number} line_number
 * @returns {PatramClaimFields | null}
 */
export function matchHiddenDirectiveFields(file_path, line, line_number) {
  return matchDirectiveFields(
    MARKDOWN_HIDDEN_DIRECTIVE_PATTERN,
    file_path,
    line,
    line_number,
  );
}

/**
 * @param {string[]} lines
 * @returns {number}
 */
function findFrontMatterClosingLineIndex(lines) {
  for (let line_index = 1; line_index < lines.length; line_index += 1) {
    if (FRONT_MATTER_BOUNDARY_PATTERN.test(lines[line_index])) {
      return line_index;
    }
  }

  return -1;
}

/**
 * @param {RegExp} pattern
 * @param {string} file_path
 * @param {string} line
 * @param {number} line_number
 * @returns {PatramClaimFields | null}
 */
function matchDirectiveFields(pattern, file_path, line, line_number) {
  const directive_match = line.match(pattern);

  if (!directive_match) {
    return null;
  }

  return {
    name: normalizeDirectiveName(directive_match[1]),
    origin: {
      column: 1,
      line: line_number,
      path: file_path,
    },
    parser: 'markdown',
    value: directive_match[2].trim(),
  };
}

/**
 * @param {string} directive_label
 * @returns {string}
 */
function normalizeDirectiveName(directive_label) {
  return directive_label
    .trim()
    .toLowerCase()
    .replaceAll(/[\s-]+/dgu, '_');
}
