/**
 * @typedef {import('./parse-cli-arguments-helpers.js').CliOptionToken} CliOptionToken
 * @typedef {import('./parse-cli-arguments-helpers.js').CliOptionValues} CliOptionValues
 */

/**
 * @param {CliOptionValues} parsed_values
 * @returns {{ query_limit?: number, query_offset?: number }}
 */
export function buildQueryPagination(parsed_values) {
  /** @type {{ query_limit?: number, query_offset?: number }} */
  const query_pagination = {};

  if (parsed_values.limit !== undefined) {
    query_pagination.query_limit = Number(parsed_values.limit);
  }

  if (parsed_values.offset !== undefined) {
    query_pagination.query_offset = Number(parsed_values.offset);
  }

  return query_pagination;
}

/**
 * @param {CliOptionToken[]} option_tokens
 * @returns {string | null}
 */
export function findInvalidQueryPagination(option_tokens) {
  for (const token of option_tokens) {
    if (
      token.name === 'offset' &&
      typeof token.value === 'string' &&
      !/^\d+$/du.test(token.value)
    ) {
      return 'Offset must be a non-negative integer.';
    }

    if (
      token.name === 'limit' &&
      typeof token.value === 'string' &&
      !/^\d+$/du.test(token.value)
    ) {
      return 'Limit must be a non-negative integer.';
    }
  }

  return null;
}
