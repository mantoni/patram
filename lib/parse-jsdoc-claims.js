/** @import * as $k$$l$load$j$patram$j$config$k$types$k$ts from './load-patram-config.types.ts'; */
/**
 * @import { ParseClaimsInput, ParseSourceFileResult, PatramClaim, PatramClaimFields } from './parse-claims.types.ts';
 */

import {
  createClaim,
  getFileExtension,
  isPathLikeTarget,
} from './claim-helpers.js';
import { normalizeDirectiveName } from './parse-markdown-directives.js';
import { collectJsdocBlocks } from './parse-jsdoc-blocks.js';
import {
  createJsdocProseClaimEntries,
  pushJsdocParagraph,
} from './parse-jsdoc-prose.js';
import { JSDOC_SOURCE_FILE_EXTENSIONS } from './source-file-defaults.js';

const JSDOC_EXTENSIONS = new Set(JSDOC_SOURCE_FILE_EXTENSIONS);
const JSDOC_LINK_TAG_PATTERN = /^@(link|see)\s+(.+)$/du;
const JSDOC_TAG_PATTERN = /^@[A-Za-z]+(?:\s|$)/du;
const JSDOC_VISIBLE_DIRECTIVE_PATTERN = /^([A-Z][A-Za-z _-]*):\s+(.+)$/du;

/**
 * Parse JSDoc metadata claims from one source file.
 *
 * @param {ParseClaimsInput} parse_input
 * @returns {ParseSourceFileResult}
 */
export function parseJsdocClaims(parse_input) {
  if (!JSDOC_EXTENSIONS.has(getFileExtension(parse_input.path))) {
    return {
      claims: [],
      diagnostics: [],
    };
  }

  const jsdoc_blocks = collectJsdocBlocks(parse_input.source);
  const active_blocks = jsdoc_blocks.filter(
    (jsdoc_block) => jsdoc_block.activation_line !== null,
  );

  if (active_blocks.length === 0) {
    return {
      claims: [],
      diagnostics: [],
    };
  }

  const claim_entries = collectJsdocClaimEntries(
    parse_input.path,
    active_blocks[0],
  ).sort(compareClaimEntries);

  return {
    claims: claim_entries.map((claim_entry, claim_index) =>
      createClaim(
        parse_input.path,
        claim_index + 1,
        claim_entry.claim_type,
        claim_entry.claim_fields,
      ),
    ),
    diagnostics: active_blocks
      .slice(1)
      .map((active_block) =>
        createMultiplePatramBlocksDiagnostic(parse_input.path, active_block),
      ),
  };
}

/**
 * @param {string} file_path
 * @param {{ lines: Array<{ column: number, content: string, line: number }> }} jsdoc_block
 * @returns {Array<{ claim_fields: PatramClaimFields, claim_type: string, order: number }>}
 */
function collectJsdocClaimEntries(file_path, jsdoc_block) {
  /** @type {Array<{ claim_fields: PatramClaimFields, claim_type: string, order: number }>} */
  const claim_entries = [];
  /** @type {Array<Array<{ column: number, content: string, line: number }>>} */
  const prose_paragraphs = [];
  /** @type {Array<{ column: number, content: string, line: number }>} */
  let current_paragraph_lines = [];

  for (const block_line of jsdoc_block.lines) {
    if (block_line.content.length === 0) {
      pushJsdocParagraph(prose_paragraphs, current_paragraph_lines);
      current_paragraph_lines = [];
      continue;
    }

    const directive_fields = matchJsdocDirectiveFields(file_path, block_line);

    if (directive_fields) {
      pushJsdocParagraph(prose_paragraphs, current_paragraph_lines);
      current_paragraph_lines = [];
      claim_entries.push({
        claim_fields: directive_fields,
        claim_type: 'directive',
        order: 0,
      });
      continue;
    }

    const jsdoc_link_claim_entry = createJsdocLinkClaimEntry(
      file_path,
      block_line,
    );

    if (jsdoc_link_claim_entry) {
      pushJsdocParagraph(prose_paragraphs, current_paragraph_lines);
      current_paragraph_lines = [];
      claim_entries.push(jsdoc_link_claim_entry);
      continue;
    }

    if (JSDOC_TAG_PATTERN.test(block_line.content)) {
      pushJsdocParagraph(prose_paragraphs, current_paragraph_lines);
      current_paragraph_lines = [];
      continue;
    }

    current_paragraph_lines.push(block_line);
  }

  pushJsdocParagraph(prose_paragraphs, current_paragraph_lines);
  claim_entries.push(
    ...createJsdocProseClaimEntries(file_path, prose_paragraphs),
  );

  return claim_entries;
}

/**
 * @param {string} file_path
 * @param {{ column: number, content: string, line: number }} block_line
 * @returns {PatramClaimFields | null}
 */
function matchJsdocDirectiveFields(file_path, block_line) {
  const directive_match = block_line.content.match(
    JSDOC_VISIBLE_DIRECTIVE_PATTERN,
  );

  if (!directive_match) {
    return null;
  }

  return {
    name: normalizeDirectiveName(directive_match[1]),
    origin: {
      column: block_line.column,
      line: block_line.line,
      path: file_path,
    },
    parser: 'jsdoc',
    value: directive_match[2].trim(),
  };
}

/**
 * @param {string} file_path
 * @param {{ column: number, content: string, line: number }} block_line
 * @returns {{ claim_fields: PatramClaimFields, claim_type: string, order: number } | null}
 */
function createJsdocLinkClaimEntry(file_path, block_line) {
  const link_match = block_line.content.match(JSDOC_LINK_TAG_PATTERN);

  if (!link_match) {
    return null;
  }

  const raw_value = link_match[2].trim();
  const [target_value, ...label_parts] = raw_value.split(/\s+/du);

  if (!target_value || !isPathLikeTarget(target_value)) {
    return null;
  }

  return {
    claim_fields: {
      origin: {
        column: block_line.column,
        line: block_line.line,
        path: file_path,
      },
      value: {
        target: target_value,
        text: label_parts.length > 0 ? label_parts.join(' ') : target_value,
      },
    },
    claim_type: 'jsdoc.link',
    order: 0,
  };
}

/**
 * @param {{ claim_fields: PatramClaimFields, claim_type: string, order: number }} left_entry
 * @param {{ claim_fields: PatramClaimFields, claim_type: string, order: number }} right_entry
 * @returns {number}
 */
function compareClaimEntries(left_entry, right_entry) {
  const left_origin = left_entry.claim_fields.origin;
  const right_origin = right_entry.claim_fields.origin;

  if (!left_origin || !right_origin) {
    return left_entry.order - right_entry.order;
  }

  if (left_origin.line !== right_origin.line) {
    return left_origin.line - right_origin.line;
  }

  if (left_origin.column !== right_origin.column) {
    return left_origin.column - right_origin.column;
  }

  return left_entry.order - right_entry.order;
}

/**
 * @param {string} file_path
 * @param {{ activation_column: number | null, activation_line: number | null }} jsdoc_block
 * @returns {$k$$l$load$j$patram$j$config$k$types$k$ts.PatramDiagnostic}
 */
function createMultiplePatramBlocksDiagnostic(file_path, jsdoc_block) {
  return {
    code: 'jsdoc.multiple_patram_blocks',
    column: jsdoc_block.activation_column ?? 1,
    level: 'error',
    line: jsdoc_block.activation_line ?? 1,
    message: `File "${file_path}" contains multiple JSDoc blocks with "@patram".`,
    path: file_path,
  };
}
