/**
 * @import { PatramClaim, ParseClaimsInput, PatramClaimFields } from './parse-claims.types.ts';
 */

import {
  matchHiddenDirectiveFields,
  matchVisibleDirectiveFields,
  parseFrontMatterDirectiveFields,
} from './parse-markdown-directives.js';
import { SUPPORTED_SOURCE_FILE_EXTENSIONS } from './source-file-defaults.js';

const MARKDOWN_EXTENSIONS = new Set(SUPPORTED_SOURCE_FILE_EXTENSIONS);
const MARKDOWN_FENCE_PATTERN = /^([`~]{3,})/du;
const MARKDOWN_LINK_PATTERN = /\[([^\]]+)\]\(([^)]+)\)/dgu;
const HEADING_PATTERN = /^#\s+(.+)$/du;
const URI_SCHEME_PATTERN = /^[A-Za-z][A-Za-z0-9+.-]*:/du;

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
  const front_matter_result = parseFrontMatterDirectiveFields(
    parse_input.path,
    lines,
  );
  /** @type {{ character: string, length: number } | null} */
  let open_fence = null;
  const title_result = getMarkdownTitle(lines, front_matter_result.body_start);

  if (title_result) {
    claims.push(
      createClaim(parse_input.path, claims.length + 1, 'document.title', {
        origin: {
          column: 1,
          line: title_result.line,
          path: parse_input.path,
        },
        value: title_result.value,
      }),
    );
  }

  for (const directive_fields of front_matter_result.directive_fields) {
    claims.push(
      createClaim(parse_input.path, claims.length + 1, 'directive', {
        ...directive_fields,
      }),
    );
  }

  for (const [line_index, line] of lines.entries()) {
    if (line_index < front_matter_result.body_start) {
      continue;
    }

    const line_number = line_index + 1;

    if (open_fence) {
      if (isClosingMarkdownFence(line, open_fence)) {
        open_fence = null;
      }

      continue;
    }

    open_fence = parseOpeningMarkdownFence(line);

    if (open_fence) {
      continue;
    }

    collectMarkdownLinkClaims(parse_input.path, line, line_number, claims);
    collectVisibleDirectiveClaims(parse_input.path, line, line_number, claims);
    collectHiddenDirectiveClaims(parse_input.path, line, line_number, claims);
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

    if (!isPathLikeMarkdownTarget(target_value)) {
      continue;
    }

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
function collectVisibleDirectiveClaims(file_path, line, line_number, claims) {
  const directive_fields = matchVisibleDirectiveFields(
    file_path,
    line,
    line_number,
  );

  if (!directive_fields) {
    return;
  }

  pushDirectiveClaim(file_path, claims, directive_fields);
}

/**
 * @param {string} file_path
 * @param {string} line
 * @param {number} line_number
 * @param {PatramClaim[]} claims
 */
function collectHiddenDirectiveClaims(file_path, line, line_number, claims) {
  const directive_fields = matchHiddenDirectiveFields(
    file_path,
    line,
    line_number,
  );

  if (!directive_fields) {
    return;
  }

  pushDirectiveClaim(file_path, claims, directive_fields);
}

/**
 * @param {string[]} lines
 * @param {number} start_line_index
 * @returns {{ line: number, value: string } | null}
 */
function getMarkdownTitle(lines, start_line_index) {
  const first_line = lines[start_line_index];

  if (first_line === undefined) {
    return null;
  }

  const trimmed_line = first_line.trim();

  if (trimmed_line.length === 0) {
    return null;
  }

  const heading_match = trimmed_line.match(HEADING_PATTERN);

  if (heading_match) {
    return {
      line: start_line_index + 1,
      value: heading_match[1].trim(),
    };
  }

  return {
    line: start_line_index + 1,
    value: trimmed_line,
  };
}

/**
 * @param {string} line
 * @returns {{ character: string, length: number } | null}
 */
function parseOpeningMarkdownFence(line) {
  const trimmed_line = line.trimStart();
  const fence_match = trimmed_line.match(MARKDOWN_FENCE_PATTERN);

  if (!fence_match) {
    return null;
  }

  return {
    character: fence_match[1][0],
    length: fence_match[1].length,
  };
}

/**
 * @param {string} line
 * @param {{ character: string, length: number }} open_fence
 * @returns {boolean}
 */
function isClosingMarkdownFence(line, open_fence) {
  const trimmed_line = line.trimStart();

  return trimmed_line.startsWith(
    open_fence.character.repeat(open_fence.length),
  );
}

/**
 * @param {string} target_value
 * @returns {boolean}
 */
function isPathLikeMarkdownTarget(target_value) {
  if (target_value.startsWith('#')) {
    return false;
  }

  return !URI_SCHEME_PATTERN.test(target_value);
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

/**
 * @param {string} file_path
 * @param {PatramClaim[]} claims
 * @param {PatramClaimFields} directive_fields
 */
function pushDirectiveClaim(file_path, claims, directive_fields) {
  claims.push(
    createClaim(file_path, claims.length + 1, 'directive', directive_fields),
  );
}
