/** @import * as $k$$l$parse$j$claims$k$types$k$ts from './parse-claims.types.ts'; */
/**
 * @import { ParseClaimsInput, ParseSourceFileResult } from './parse-claims.types.ts';
 */

import { getFileExtension } from './claim-helpers.js';
import { parseJsdocClaims } from './parse-jsdoc-claims.js';
import { parseMarkdownClaims } from './parse-markdown-claims.js';
import { MARKDOWN_SOURCE_FILE_EXTENSIONS } from './source-file-defaults.js';

/**
 * Source claim dispatch.
 *
 * Routes each source file to markdown or JSDoc claim parsing and keeps claim
 * extraction on one entrypoint.
 *
 * Kind: parse
 * Status: active
 * Uses Term: ../docs/reference/terms/claim.md
 * Uses Term: ../docs/reference/terms/document.md
 * Tracked in: ../docs/plans/v0/source-anchor-dogfooding.md
 * Decided by: ../docs/decisions/jsdoc-metadata-directive-syntax.md
 * Implements: ../docs/tasks/v0/parse-claims.md
 * @patram
 * @see {@link ./parse-markdown-claims.js}
 * @see {@link ./parse-jsdoc-claims.js}
 */

const MARKDOWN_EXTENSIONS = new Set(MARKDOWN_SOURCE_FILE_EXTENSIONS);

/**
 * Parse one source file into claims and diagnostics.
 *
 * @param {ParseClaimsInput} parse_input
 * @returns {ParseSourceFileResult}
 */
export function parseSourceFile(parse_input) {
  const file_extension = getFileExtension(parse_input.path);

  if (MARKDOWN_EXTENSIONS.has(file_extension)) {
    return {
      claims: parseMarkdownClaims(parse_input),
      diagnostics: [],
    };
  }

  return parseJsdocClaims(parse_input);
}

/**
 * Parse a file into neutral Patram claims.
 *
 * @param {ParseClaimsInput} parse_input
 * @returns {$k$$l$parse$j$claims$k$types$k$ts.PatramClaim[]}
 */
export function parseClaims(parse_input) {
  return parseSourceFile(parse_input).claims;
}
