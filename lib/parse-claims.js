/**
 * @import { PatramClaim, ParseClaimsInput, PatramClaimFields } from './parse-claims.types.ts';
 */

const MARKDOWN_EXTENSIONS = new Set(['.md', '.markdown']);
const MARKDOWN_LINK_PATTERN = /\[([^\]]+)\]\(([^)]+)\)/dgu;
const DIRECTIVE_PATTERN = /^(?:-\s+)?([A-Z][A-Za-z ]+):\s+(.+)$/du;
const HEADING_PATTERN = /^#\s+(.+)$/du;

/**
 * Parse a file into neutral Patram claims.
 *
 * @param {ParseClaimsInput} parse_input
 * @returns {PatramClaim[]}
 */
export function parseClaims(parse_input) {
  const file_extension = getFileExtension(parse_input.path);

  if (MARKDOWN_EXTENSIONS.has(file_extension)) {
    return parseMarkdownClaims(parse_input);
  }

  return [];
}

/**
 * @param {ParseClaimsInput} parse_input
 * @returns {PatramClaim[]}
 */
function parseMarkdownClaims(parse_input) {
  const lines = parse_input.source.split('\n');

  /** @type {PatramClaim[]} */
  const claims = [];
  const title_value = getMarkdownTitle(lines);

  if (title_value) {
    claims.push(
      createClaim(parse_input.path, claims.length + 1, 'document.title', {
        value: title_value,
      }),
    );
  }

  for (const [line_index, line] of lines.entries()) {
    const line_number = line_index + 1;

    collectMarkdownLinkClaims(parse_input.path, line, line_number, claims);
    collectDirectiveClaims(parse_input.path, line, line_number, claims);
  }

  return claims;
}

/**
 * @param {string} file_path
 * @param {string} line
 * @param {number} line_number
 * @param {PatramClaim[]} claims
 */
function collectMarkdownLinkClaims(file_path, line, line_number, claims) {
  for (const link_match of line.matchAll(MARKDOWN_LINK_PATTERN)) {
    const link_text = link_match[1];
    const target_value = link_match[2];
    const column_number =
      link_match.index === undefined ? 1 : link_match.index + 1;

    claims.push(
      createClaim(file_path, claims.length + 1, 'markdown.link', {
        origin: {
          column: column_number,
          line: line_number,
          path: file_path,
        },
        value: {
          target: target_value,
          text: link_text,
        },
      }),
    );
  }
}

/**
 * @param {string} file_path
 * @param {string} line
 * @param {number} line_number
 * @param {PatramClaim[]} claims
 */
function collectDirectiveClaims(file_path, line, line_number, claims) {
  const directive_match = line.match(DIRECTIVE_PATTERN);

  if (!directive_match) {
    return;
  }

  const directive_name = normalizeDirectiveName(directive_match[1]);
  const directive_value = directive_match[2].trim();

  claims.push(
    createClaim(file_path, claims.length + 1, 'directive', {
      name: directive_name,
      origin: {
        column: 1,
        line: line_number,
        path: file_path,
      },
      parser: 'markdown',
      value: directive_value,
    }),
  );
}

/**
 * @param {string[]} lines
 * @returns {string | null}
 */
function getMarkdownTitle(lines) {
  const first_line = lines[0].trim();

  if (first_line.length === 0) {
    return null;
  }

  const heading_match = first_line.match(HEADING_PATTERN);

  if (heading_match) {
    return heading_match[1].trim();
  }

  return first_line;
}

/**
 * @param {string} file_path
 * @param {number} claim_number
 * @param {string} claim_type
 * @param {PatramClaimFields} claim_fields
 * @returns {PatramClaim}
 */
function createClaim(file_path, claim_number, claim_type, claim_fields) {
  const document_id = `doc:${file_path}`;
  const origin = claim_fields.origin ?? {
    column: 1,
    line: 1,
    path: file_path,
  };

  return {
    ...claim_fields,
    document_id,
    id: `claim:${document_id}:${claim_number}`,
    origin,
    type: claim_type,
  };
}

/**
 * @param {string} directive_label
 * @returns {string}
 */
function normalizeDirectiveName(directive_label) {
  return directive_label.trim().toLowerCase().replaceAll(/\s+/dgu, '_');
}

/**
 * @param {string} file_path
 * @returns {string}
 */
function getFileExtension(file_path) {
  const last_dot_index = file_path.lastIndexOf('.');

  if (last_dot_index < 0) {
    return '';
  }

  return file_path.slice(last_dot_index);
}
