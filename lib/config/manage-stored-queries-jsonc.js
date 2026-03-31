/**
 * @import { FormattingOptions } from 'jsonc-parser';
 */

import { applyEdits, modify } from 'jsonc-parser';

/**
 * @typedef {{
 *   action: 'added',
 *   name: string,
 * } | {
 *   action: 'removed',
 *   name: string,
 * } | {
 *   action: 'updated',
 *   name: string,
 *   previous_name?: string,
 * }} StoredQueryMutationResult
 */

/**
 * @param {string} config_source
 * @param {Record<string, unknown>} raw_queries
 * @param {StoredQueryMutationResult} mutation_result
 * @returns {string}
 */
export function applyStoredQueryMutationToConfigSource(
  config_source,
  raw_queries,
  mutation_result,
) {
  const formatting_options = inferFormattingOptions(config_source);
  let next_config_source = config_source;

  if (
    mutation_result.action === 'updated' &&
    mutation_result.previous_name !== undefined
  ) {
    next_config_source = applyConfigEdit(
      next_config_source,
      ['queries', mutation_result.previous_name],
      undefined,
      formatting_options,
    );
  }

  if (mutation_result.action === 'removed') {
    return applyConfigEdit(
      next_config_source,
      ['queries', mutation_result.name],
      undefined,
      formatting_options,
    );
  }

  return applyConfigEdit(
    next_config_source,
    ['queries', mutation_result.name],
    raw_queries[mutation_result.name],
    formatting_options,
  );
}

/**
 * @param {string} config_source
 * @returns {FormattingOptions}
 */
function inferFormattingOptions(config_source) {
  const indentation_match = config_source.match(/^(?<indentation>[ \t]+)\S/mu);
  const indentation = indentation_match?.groups?.indentation ?? '  ';
  const insert_spaces = !indentation.includes('\t');

  return {
    eol: config_source.includes('\r\n') ? '\r\n' : '\n',
    insertFinalNewline: config_source.endsWith('\n'),
    insertSpaces: insert_spaces,
    tabSize: insert_spaces ? indentation.length : 1,
  };
}

/**
 * @param {string} config_source
 * @param {(string | number)[]} path
 * @param {unknown} value
 * @param {FormattingOptions} formatting_options
 * @returns {string}
 */
function applyConfigEdit(config_source, path, value, formatting_options) {
  return applyEdits(
    config_source,
    modify(config_source, path, value, {
      formattingOptions: formatting_options,
    }),
  );
}
