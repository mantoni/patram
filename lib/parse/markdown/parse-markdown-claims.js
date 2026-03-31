/**
 * @import { PatramClaim, ParseClaimsInput, PatramClaimFields } from '../parse-claims.types.ts';
 * @import { PatramDiagnostic } from '../../config/load-patram-config.types.ts';
 */

import { createClaim, isPathLikeTarget } from '../claim-helpers.js';
import {
  getMarkdownDescription,
  getMarkdownTitle,
} from './parse-markdown-prose.js';
import {
  matchHiddenDirectiveFields,
  matchVisibleDirectiveFields,
  parseFrontMatterDirectiveFields,
} from './parse-markdown-directives.js';

/**
 * Markdown claim parsing.
 *
 * Extracts document titles, directives, and links from markdown source while
 * ignoring fenced-code link noise.
 *
 * Kind: parse
 * Status: active
 * Tracked in: ../../../docs/plans/v0/source-anchor-dogfooding.md
 * Decided by: ../../../docs/decisions/markdown-metadata-directive-syntax.md
 * Decided by: ../../../docs/decisions/markdown-link-claim-scope.md
 * @patram
 * @see {@link ../parse-claims.js}
 * @see {@link ../../../docs/decisions/markdown-metadata-directive-syntax.md}
 */

const MARKDOWN_FENCE_PATTERN = /^([`~]{3,})/du;
const MARKDOWN_LINK_PATTERN = /\[([^\]]+)\]\(([^)]+)\)/dgu;

/**
 * @param {ParseClaimsInput} parse_input
 * @param {{ multi_value_directive_names?: ReadonlySet<string> }} [parse_options]
 * @returns {{ claims: PatramClaim[], diagnostics: PatramDiagnostic[] }}
 */
export function parseMarkdownClaims(parse_input, parse_options) {
  const lines = parse_input.source.split('\n');
  const front_matter_result = parseFrontMatterDirectiveFields(
    parse_input.path,
    lines,
    parse_options,
  );
  /** @type {PatramClaim[]} */
  const claims = collectMarkdownMetadataClaims(
    parse_input.path,
    lines,
    front_matter_result.body_start,
  );
  /** @type {{ character: string, length: number } | null} */
  let open_fence = null;

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

  return {
    claims,
    diagnostics: front_matter_result.diagnostics,
  };
}

/**
 * @param {string} file_path
 * @param {string[]} lines
 * @param {number} start_line_index
 * @returns {PatramClaim[]}
 */
function collectMarkdownMetadataClaims(file_path, lines, start_line_index) {
  /** @type {PatramClaim[]} */
  const claims = [];
  const title_result = getMarkdownTitle(lines, start_line_index);

  if (title_result) {
    claims.push(createDocumentTitleClaim(file_path, title_result));
  }

  const description_result = getMarkdownDescription(
    file_path,
    lines,
    title_result,
  );

  if (description_result) {
    claims.push(createDocumentDescriptionClaim(file_path, description_result));
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

    if (!isPathLikeTarget(target_value)) {
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

  if (directive_fields) {
    pushDirectiveClaim(file_path, claims, directive_fields);
  }
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

  if (directive_fields) {
    pushDirectiveClaim(file_path, claims, directive_fields);
  }
}

/**
 * @param {string} file_path
 * @param {{ line: number, value: string }} title_result
 * @returns {PatramClaim}
 */
function createDocumentTitleClaim(file_path, title_result) {
  return createClaim(file_path, 1, 'document.title', {
    origin: {
      column: 1,
      line: title_result.line,
      path: file_path,
    },
    value: title_result.value,
  });
}

/**
 * @param {string} file_path
 * @param {{ column: number, line: number, value: string }} description_result
 * @returns {PatramClaim}
 */
function createDocumentDescriptionClaim(file_path, description_result) {
  return createClaim(file_path, 2, 'document.description', {
    origin: {
      column: description_result.column,
      line: description_result.line,
      path: file_path,
    },
    value: description_result.value,
  });
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
 * @param {string} file_path
 * @param {PatramClaim[]} claims
 * @param {PatramClaimFields} directive_fields
 */
function pushDirectiveClaim(file_path, claims, directive_fields) {
  claims.push(
    createClaim(file_path, claims.length + 1, 'directive', directive_fields),
  );
}
