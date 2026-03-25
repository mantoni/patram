/** @import * as yaml from 'yaml'; */
/* eslint-disable max-lines */
/**
 * @import { PatramDiagnostic } from './load-patram-config.types.ts';
 * @import { ParseClaimsInput, ParseSourceFileResult, PatramClaimFields } from './parse-claims.types.ts';
 */

import { isMap, isScalar, isSeq, LineCounter, parseAllDocuments } from 'yaml';

import { createClaim, getFileExtension } from './claim-helpers.js';
import { YAML_SOURCE_FILE_EXTENSIONS } from './source-file-defaults.js';

/**
 * YAML claim parsing.
 *
 * Parses standalone YAML metadata files and front matter with one projection
 * model for top-level scalar directives.
 *
 * Kind: parse
 * Status: active
 * Tracked in: ../docs/plans/v0/yaml-source-and-front-matter.md
 * Decided by: ../docs/decisions/yaml-source-and-front-matter.md
 * @patram
 * @see {@link ./parse-claims.js}
 * @see {@link ./parse-markdown-directives.js}
 */

const YAML_EXTENSIONS = new Set(YAML_SOURCE_FILE_EXTENSIONS);

/**
 * Parse standalone YAML source into neutral directive claims.
 *
 * @param {ParseClaimsInput} parse_input
 * @param {{ multi_value_directive_names?: ReadonlySet<string> }} [parse_options]
 * @returns {ParseSourceFileResult}
 */
export function parseYamlClaims(parse_input, parse_options) {
  if (!YAML_EXTENSIONS.has(getFileExtension(parse_input.path))) {
    return {
      claims: [],
      diagnostics: [],
    };
  }

  const parse_result = parseYamlDirectiveFields({
    file_path: parse_input.path,
    parser: 'yaml',
    source_text: parse_input.source,
    start_line: 1,
    multi_value_directive_names: parse_options?.multi_value_directive_names,
  });

  return {
    claims: parse_result.directive_fields.map((directive_fields, claim_index) =>
      createClaim(
        parse_input.path,
        claim_index + 1,
        'directive',
        directive_fields,
      ),
    ),
    diagnostics: parse_result.diagnostics,
  };
}

/**
 * Parse YAML metadata into neutral directive fields.
 *
 * @param {{
 *   file_path: string,
 *   parser: 'markdown' | 'yaml',
 *   source_text: string,
 *   start_line: number,
 *   markdown_style?: 'front_matter',
 *   multi_value_directive_names?: ReadonlySet<string>,
 * }} parse_input
 * @returns {{ diagnostics: PatramDiagnostic[], directive_fields: PatramClaimFields[] }}
 */
export function parseYamlDirectiveFields(parse_input) {
  const line_counter = new LineCounter();
  const yaml_documents = parseAllDocuments(parse_input.source_text, {
    lineCounter: line_counter,
    prettyErrors: false,
  });
  const parse_result = resolveYamlParseResult(
    parse_input,
    yaml_documents,
    line_counter,
  );

  if (!parse_result.success) {
    return parse_result.value;
  }

  return {
    diagnostics: [],
    directive_fields: collectDirectiveFields(
      parse_input,
      parse_result.value,
      line_counter,
    ),
  };
}

/**
 * @param {{
 *   file_path: string,
 *   start_line: number,
 * }} parse_input
 * @param {any[]} yaml_documents
 * @param {LineCounter} line_counter
 * @returns {{
  success: true,
  value: yaml.YAMLMap<unknown, unknown>
} | {
  success: false,
  value: {diagnostics: PatramDiagnostic[], directive_fields: PatramClaimFields[]}
}}
 *   success: true,
 *   value: import('yaml').YAMLMap<unknown, unknown>,
 * } | {
 *   success: false,
 *   value: { diagnostics: PatramDiagnostic[], directive_fields: PatramClaimFields[] },
 * }}
 */
function resolveYamlParseResult(parse_input, yaml_documents, line_counter) {
  if (yaml_documents.length !== 1) {
    return {
      success: false,
      value: createDiagnosticResult([
        createYamlDiagnostic(
          parse_input.file_path,
          line_counter,
          yaml_documents[1]?.range?.[0] ?? 0,
          parse_input.start_line,
          'yaml.multiple_documents',
          'Patram YAML sources must contain exactly one document.',
        ),
      ]),
    };
  }

  const yaml_document = yaml_documents[0];

  if (yaml_document.errors.length > 0) {
    return {
      success: false,
      value: createDiagnosticResult(
        yaml_document.errors.map(
          /** @param {{ message: string, pos: [number, number] }} yaml_error */
          (yaml_error) =>
            createYamlDiagnostic(
              parse_input.file_path,
              line_counter,
              yaml_error.pos[0] ?? 0,
              parse_input.start_line,
              'yaml.invalid_syntax',
              yaml_error.message,
            ),
        ),
      ),
    };
  }

  if (!isMap(yaml_document.contents)) {
    return {
      success: false,
      value: createDiagnosticResult([
        createYamlDiagnostic(
          parse_input.file_path,
          line_counter,
          resolveNodeRangeStart(yaml_document.contents),
          parse_input.start_line,
          'yaml.invalid_root',
          'Patram YAML metadata must use one top-level mapping.',
        ),
      ]),
    };
  }

  return {
    success: true,
    value: yaml_document.contents,
  };
}

/**
 * @param {{
 *   file_path: string,
 *   parser: 'markdown' | 'yaml',
 *   start_line: number,
 *   markdown_style?: 'front_matter',
 *   multi_value_directive_names?: ReadonlySet<string>,
 * }} parse_input
 * @param {import('yaml').YAMLMap<unknown, unknown>} yaml_map
 * @param {LineCounter} line_counter
 * @returns {PatramClaimFields[]}
 */
function collectDirectiveFields(parse_input, yaml_map, line_counter) {
  /** @type {PatramClaimFields[]} */
  const directive_fields = [];

  for (const pair of yaml_map.items) {
    const pair_fields = createPairDirectiveFields(
      parse_input,
      pair,
      line_counter,
    );

    directive_fields.push(...pair_fields);
  }

  return directive_fields;
}

/**
 * @param {{
 *   file_path: string,
 *   parser: 'markdown' | 'yaml',
 *   start_line: number,
 *   markdown_style?: 'front_matter',
 *   multi_value_directive_names?: ReadonlySet<string>,
 * }} parse_input
 * @param {any} yaml_pair
 * @param {LineCounter} line_counter
 * @returns {PatramClaimFields[]}
 */
function createPairDirectiveFields(parse_input, yaml_pair, line_counter) {
  const directive_name = resolveDirectiveName(yaml_pair.key);

  if (!directive_name || yaml_pair.value === null) {
    return [];
  }

  if (isScalar(yaml_pair.value)) {
    return createScalarDirectiveFields(
      parse_input,
      directive_name,
      yaml_pair.key,
      yaml_pair.value.value,
      line_counter,
    );
  }

  if (!shouldCollectSequence(parse_input, directive_name, yaml_pair.value)) {
    return [];
  }

  const sequence_items =
    /** @type {Array<{ range?: [number, number, number], value: unknown }>} */ (
      yaml_pair.value.items
    );

  return sequence_items.flatMap((sequence_item) =>
    createScalarDirectiveFields(
      parse_input,
      directive_name,
      sequence_item,
      sequence_item.value,
      line_counter,
    ),
  );
}

/**
 * @param {{
 *   file_path: string,
 *   parser: 'markdown' | 'yaml',
 *   start_line: number,
 *   markdown_style?: 'front_matter',
 * }} parse_input
 * @param {string} directive_name
 * @param {{ range?: [number, number, number] }} yaml_node
 * @param {unknown} scalar_value
 * @param {LineCounter} line_counter
 * @returns {PatramClaimFields[]}
 */
function createScalarDirectiveFields(
  parse_input,
  directive_name,
  yaml_node,
  scalar_value,
  line_counter,
) {
  const normalized_value = normalizeScalarValue(scalar_value);

  if (normalized_value === null) {
    return [];
  }

  return [
    {
      ...createDirectiveBaseFields(parse_input, yaml_node, line_counter),
      name: directive_name,
      value: normalized_value,
    },
  ];
}

/**
 * @param {{
 *   multi_value_directive_names?: ReadonlySet<string>,
 * }} parse_input
 * @param {string} directive_name
 * @param {unknown} yaml_value
 * @returns {boolean}
 */
function shouldCollectSequence(parse_input, directive_name, yaml_value) {
  return (
    isSeq(yaml_value) &&
    parse_input.multi_value_directive_names?.has(directive_name) === true &&
    yaml_value.items.every(isNonNullScalarNode)
  );
}

/**
 * @param {{
 *   file_path: string,
 *   parser: 'markdown' | 'yaml',
 *   start_line: number,
 *   markdown_style?: 'front_matter',
 * }} parse_input
 * @param {{ range?: [number, number, number] }} yaml_node
 * @param {LineCounter} line_counter
 * @returns {PatramClaimFields}
 */
function createDirectiveBaseFields(parse_input, yaml_node, line_counter) {
  /** @type {PatramClaimFields} */
  const directive_fields = {
    name: '',
    origin: createOrigin(
      parse_input.file_path,
      yaml_node.range?.[0] ?? 0,
      parse_input.start_line,
      line_counter,
    ),
    parser: parse_input.parser,
    value: '',
  };

  if (parse_input.markdown_style !== undefined) {
    directive_fields.markdown_style = parse_input.markdown_style;
  }

  return directive_fields;
}

/**
 * @param {unknown} yaml_key
 * @returns {string | null}
 */
function resolveDirectiveName(yaml_key) {
  if (!isScalar(yaml_key) || typeof yaml_key.value !== 'string') {
    return null;
  }

  return normalizeDirectiveName(yaml_key.value);
}

/**
 * @param {unknown} scalar_value
 * @returns {string | null}
 */
function normalizeScalarValue(scalar_value) {
  if (scalar_value === null) {
    return null;
  }

  if (typeof scalar_value === 'string') {
    return scalar_value;
  }

  if (typeof scalar_value === 'boolean' || typeof scalar_value === 'number') {
    return String(scalar_value);
  }

  return null;
}

/**
 * @param {unknown} yaml_node
 * @returns {boolean}
 */
function isNonNullScalarNode(yaml_node) {
  return isScalar(yaml_node) && normalizeScalarValue(yaml_node.value) !== null;
}

/**
 * @param {string} file_path
 * @param {number} offset
 * @param {number} start_line
 * @param {LineCounter} line_counter
 * @returns {{ column: number, line: number, path: string }}
 */
function createOrigin(file_path, offset, start_line, line_counter) {
  const location = line_counter.linePos(offset);

  return {
    column: location?.col ?? 1,
    line: (location?.line ?? 1) + start_line - 1,
    path: file_path,
  };
}

/**
 * @param {string} file_path
 * @param {LineCounter} line_counter
 * @param {number} offset
 * @param {number} start_line
 * @param {string} code
 * @param {string} message
 * @returns {PatramDiagnostic}
 */
function createYamlDiagnostic(
  file_path,
  line_counter,
  offset,
  start_line,
  code,
  message,
) {
  const origin = createOrigin(file_path, offset, start_line, line_counter);

  return {
    code,
    column: origin.column,
    level: 'error',
    line: origin.line,
    message,
    path: file_path,
  };
}

/**
 * @param {PatramDiagnostic[]} diagnostics
 * @returns {{ diagnostics: PatramDiagnostic[], directive_fields: PatramClaimFields[] }}
 */
function createDiagnosticResult(diagnostics) {
  return {
    diagnostics,
    directive_fields: [],
  };
}

/**
 * @param {unknown} yaml_node
 * @returns {number}
 */
function resolveNodeRangeStart(yaml_node) {
  if (
    yaml_node &&
    typeof yaml_node === 'object' &&
    'range' in yaml_node &&
    Array.isArray(yaml_node.range) &&
    typeof yaml_node.range[0] === 'number'
  ) {
    return yaml_node.range[0];
  }

  return 0;
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
