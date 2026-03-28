/**
 * @import { ParseClaimsInput, ParseSourceFileResult, PatramClaim } from './parse-claims.types.ts';
 */

import { getFileExtension } from './claim-helpers.js';
import { parseJsdocClaims } from './jsdoc/parse-jsdoc-claims.js';
import { parseMarkdownClaims } from './markdown/parse-markdown-claims.js';
import { parseYamlClaims } from './yaml/parse-yaml-claims.js';
import {
  MARKDOWN_SOURCE_FILE_EXTENSIONS,
  YAML_SOURCE_FILE_EXTENSIONS,
} from '../config/source-file-defaults.js';

/**
 * Source claim dispatch.
 *
 * Routes each source file to markdown or JSDoc claim parsing and keeps claim
 * extraction on one entrypoint.
 *
 * Kind: parse
 * Status: active
 * Uses Term: ../../docs/reference/terms/claim.md
 * Uses Term: ../../docs/reference/terms/document.md
 * Tracked in: ../../docs/plans/v0/source-anchor-dogfooding.md
 * Decided by: ../../docs/decisions/jsdoc-metadata-directive-syntax.md
 * Implements: ../../docs/tasks/v0/parse-claims.md
 * @patram
 * @see {@link ./markdown/parse-markdown-claims.js}
 * @see {@link ./jsdoc/parse-jsdoc-claims.js}
 */

const MARKDOWN_EXTENSIONS = new Set(MARKDOWN_SOURCE_FILE_EXTENSIONS);
const YAML_EXTENSIONS = new Set(YAML_SOURCE_FILE_EXTENSIONS);

/**
 * Parse one source file into claims and diagnostics.
 *
 * @param {ParseClaimsInput} parse_input
 * @param {{ multi_value_directive_names?: ReadonlySet<string> }} [parse_options]
 * @returns {ParseSourceFileResult}
 */
export function parseSourceFile(parse_input, parse_options) {
  const file_extension = getFileExtension(parse_input.path);

  if (MARKDOWN_EXTENSIONS.has(file_extension)) {
    return parseMarkdownClaims(parse_input, parse_options);
  }

  if (YAML_EXTENSIONS.has(file_extension)) {
    return parseYamlClaims(parse_input, parse_options);
  }

  return parseJsdocClaims(parse_input);
}

/**
 * Parse a file into neutral Patram claims.
 *
 * @param {ParseClaimsInput} parse_input
 * @param {{ multi_value_directive_names?: ReadonlySet<string> }} [parse_options]
 * @returns {PatramClaim[]}
 */
export function parseClaims(parse_input, parse_options) {
  return parseSourceFile(parse_input, parse_options).claims;
}

/**
 * Build parser options from repo config.
 *
 * @param {{ fields?: Record<string, { multiple?: boolean }>, mappings?: Record<string, { emit?: unknown, node?: unknown }> } | undefined} repo_config
 * @returns {{ multi_value_directive_names: Set<string> }}
 */
export function createParseOptions(repo_config) {
  return {
    multi_value_directive_names: collectMultiValueDirectiveNames(repo_config),
  };
}

/**
 * @param {{ fields?: Record<string, { multiple?: boolean }>, mappings?: Record<string, { emit?: unknown, node?: unknown }> } | undefined} repo_config
 * @returns {Set<string>}
 */
function collectMultiValueDirectiveNames(repo_config) {
  /** @type {Set<string>} */
  const multi_value_directive_names = new Set();

  collectMultipleFieldNames(repo_config?.fields, multi_value_directive_names);
  collectEmitOnlyDirectiveNames(
    repo_config?.mappings,
    multi_value_directive_names,
  );

  return multi_value_directive_names;
}

/**
 * @param {Record<string, { multiple?: boolean }> | undefined} fields
 * @param {Set<string>} multi_value_directive_names
 */
function collectMultipleFieldNames(fields, multi_value_directive_names) {
  for (const [field_name, field_definition] of Object.entries(fields ?? {})) {
    if (field_definition.multiple === true) {
      multi_value_directive_names.add(field_name);
    }
  }
}

/**
 * @param {Record<string, { emit?: unknown, node?: unknown }> | undefined} mappings
 * @param {Set<string>} multi_value_directive_names
 */
function collectEmitOnlyDirectiveNames(mappings, multi_value_directive_names) {
  for (const [mapping_name, mapping_definition] of Object.entries(
    mappings ?? {},
  )) {
    const directive_name = resolveEmitOnlyDirectiveName(
      mapping_name,
      mapping_definition,
    );

    if (directive_name) {
      multi_value_directive_names.add(directive_name);
    }
  }
}

/**
 * @param {string} mapping_name
 * @param {{ emit?: unknown, node?: unknown }} mapping_definition
 * @returns {string | null}
 */
function resolveEmitOnlyDirectiveName(mapping_name, mapping_definition) {
  const directive_match = mapping_name.match(/^[^.]+\.directive\.(.+)$/du);

  if (
    !directive_match ||
    mapping_definition.emit === undefined ||
    mapping_definition.node !== undefined
  ) {
    return null;
  }

  return directive_match[1];
}
