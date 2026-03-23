/**
 * @import { PatramRepoConfig } from './load-patram-config.types.ts';
 */

/**
 * @typedef {{ kind: 'ad_hoc' } | { kind: 'stored_query', name: string }} QuerySource
 */

/**
 * Resolve an ad hoc or stored query into a where clause.
 *
 * @param {PatramRepoConfig} repo_config
 * @param {string[]} command_arguments
 * @returns {{ success: true, value: { query_source: QuerySource, where_clause: string } } | { success: false, message: string }}
 */
export function resolveWhereClause(repo_config, command_arguments) {
  if (command_arguments[0] === '--where') {
    const where_clause = command_arguments.slice(1).join(' ').trim();

    if (where_clause.length === 0) {
      return {
        message: 'Query requires a where clause.',
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
      message: 'Query requires "--where" or a stored query name.',
      success: false,
    };
  }

  const stored_query = repo_config.queries[stored_query_name];

  if (!stored_query) {
    return {
      message: `Stored query "${stored_query_name}" was not found.`,
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
