/**
 * @import { MarkdownDirectiveStyle, PatramClaimFields } from './parse-claims.types.ts';
 * @import { PatramDiagnostic } from '../load-patram-config.types.ts';
 */

import { parseYamlDirectiveFields } from './parse-yaml-claims.js';

const FRONT_MATTER_BOUNDARY_PATTERN = /^---$/du;
const MARKDOWN_HIDDEN_DIRECTIVE_PATTERN =
  /^\[patram\s+([A-Za-z][A-Za-z0-9 _-]*)=(.+)\]:\s*#\s*$/du;
const LIST_ITEM_DIRECTIVE_PATTERN = /^-\s+([A-Z][A-Za-z _-]*):\s+(.+)$/du;
const VISIBLE_DIRECTIVE_PATTERN = /^([A-Z][A-Za-z _-]*):\s+(.+)$/du;

/**
 * @param {string} file_path
 * @param {string[]} lines
 * @param {{ multi_value_directive_names?: ReadonlySet<string> }} [parse_options]
 * @returns {{ body_start: number, diagnostics: PatramDiagnostic[], directive_fields: PatramClaimFields[] }}
 */
export function parseFrontMatterDirectiveFields(
  file_path,
  lines,
  parse_options,
) {
  if (lines[0] !== '---') {
    return {
      body_start: 0,
      diagnostics: [],
      directive_fields: [],
    };
  }

  const closing_line_index = findFrontMatterClosingLineIndex(lines);

  if (closing_line_index < 0) {
    return {
      body_start: 0,
      diagnostics: [],
      directive_fields: [],
    };
  }
  const parse_result = parseYamlDirectiveFields({
    file_path,
    markdown_style: 'front_matter',
    multi_value_directive_names: parse_options?.multi_value_directive_names,
    parser: 'markdown',
    source_text: lines.slice(1, closing_line_index).join('\n'),
    start_line: 2,
  });

  return {
    body_start: closing_line_index + 1,
    diagnostics: parse_result.diagnostics,
    directive_fields: parse_result.directive_fields,
  };
}

/**
 * @param {string} file_path
 * @param {string} line
 * @param {number} line_number
 * @returns {PatramClaimFields | null}
 */
export function matchVisibleDirectiveFields(file_path, line, line_number) {
  const list_item_match = matchDirectiveFields(
    LIST_ITEM_DIRECTIVE_PATTERN,
    'list_item',
    file_path,
    line,
    line_number,
  );

  if (list_item_match) {
    return list_item_match;
  }

  return matchDirectiveFields(
    VISIBLE_DIRECTIVE_PATTERN,
    'visible_line',
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
    'hidden_tag',
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
 * @param {MarkdownDirectiveStyle} markdown_style
 * @param {string} file_path
 * @param {string} line
 * @param {number} line_number
 * @returns {PatramClaimFields | null}
 */
function matchDirectiveFields(
  pattern,
  markdown_style,
  file_path,
  line,
  line_number,
) {
  const directive_match = line.match(pattern);

  if (!directive_match) {
    return null;
  }

  return {
    markdown_style,
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
export function normalizeDirectiveName(directive_label) {
  return directive_label
    .trim()
    .toLowerCase()
    .replaceAll(/[\s-]+/dgu, '_');
}
