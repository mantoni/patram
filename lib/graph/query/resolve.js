/**
 * @import { CliParseError } from '../../cli/arguments.types.ts';
 * @import { PatramRepoConfig } from '../../config/load-patram-config.types.ts';
 */

import { findCloseMatch } from '../../find-close-match.js';

/**
 * @typedef {{ kind: 'ad_hoc' } | { kind: 'stored_query', name: string }} QuerySource
 */

/**
 * Resolve an ad hoc or stored query into a where clause.
 *
 * @param {PatramRepoConfig} repo_config
 * @param {string[]} command_arguments
 * @returns {{ success: true, value: { query_source: QuerySource, where_clause: string } } | { error: CliParseError, success: false }}
 */
export function resolveWhereClause(repo_config, command_arguments) {
  if (command_arguments[0] === '--where') {
    const where_clause = command_arguments.slice(1).join(' ').trim();

    if (where_clause.length === 0) {
      return {
        error: {
          code: 'message',
          message: 'Query requires a where clause.',
        },
        success: false,
      };
    }

    return {
      success: true,
      value: {
        query_source: {
          kind: 'ad_hoc',
        },
        where_clause,
      },
    };
  }

  const stored_query_name = command_arguments[0];

  if (!stored_query_name) {
    return {
      error: {
        code: 'message',
        message: 'Query requires "--where" or a stored query name.',
      },
      success: false,
    };
  }

  const stored_query = repo_config.queries[stored_query_name];

  if (!stored_query) {
    return {
      error: createUnknownStoredQueryError(
        stored_query_name,
        Object.keys(repo_config.queries),
      ),
      success: false,
    };
  }

  return {
    success: true,
    value: {
      query_source: {
        kind: 'stored_query',
        name: stored_query_name,
      },
      where_clause: stored_query.where,
    },
  };
}

/**
 * @param {string} stored_query_name
 * @param {string[]} stored_query_names
 * @returns {CliParseError}
 */
export function createUnknownStoredQueryError(
  stored_query_name,
  stored_query_names,
) {
  const suggestion = findCloseMatch(stored_query_name, stored_query_names);

  if (!suggestion) {
    return {
      code: 'unknown_stored_query',
      name: stored_query_name,
    };
  }

  return {
    code: 'unknown_stored_query',
    name: stored_query_name,
    suggestion,
  };
}
