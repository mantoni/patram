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
  const ad_hoc_result = resolveAdHocWhereClause(command_arguments);

  if (ad_hoc_result) {
    return ad_hoc_result;
  }

  const stored_query_name = command_arguments[0];

  if (!stored_query_name) {
    return {
      error: {
        code: 'message',
        message:
          'Query requires "--cypher", "--where", or a stored query name.',
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

  const query_text = stored_query.cypher ?? stored_query.where;

  if (!query_text) {
    return {
      error: {
        code: 'message',
        message: `Stored query "${stored_query_name}" is missing query text.`,
      },
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
      where_clause: query_text,
    },
  };
}

/**
 * @param {string[]} command_arguments
 * @returns {{ success: true, value: { query_source: QuerySource, where_clause: string } } | { error: CliParseError, success: false } | null}
 */
function resolveAdHocWhereClause(command_arguments) {
  if (command_arguments[0] === '--cypher') {
    return createAdHocWhereClauseResult(
      command_arguments,
      '--cypher',
      'Query requires a Cypher statement.',
    );
  }

  if (command_arguments[0] === '--where') {
    return createAdHocWhereClauseResult(
      command_arguments,
      '--where',
      'Query requires a where clause.',
    );
  }

  return null;
}

/**
 * @param {string[]} command_arguments
 * @param {'--cypher' | '--where'} option_name
 * @param {string} empty_message
 * @returns {{ success: true, value: { query_source: QuerySource, where_clause: string } } | { error: CliParseError, success: false }}
 */
function createAdHocWhereClauseResult(
  command_arguments,
  option_name,
  empty_message,
) {
  const query_text = command_arguments.slice(1).join(' ').trim();

  if (query_text.length === 0) {
    return {
      error: {
        code: 'message',
        message: empty_message,
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
      where_clause: query_text,
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
