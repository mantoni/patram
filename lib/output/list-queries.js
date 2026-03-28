/**
 * @import { StoredQueryConfig } from '../config/load-patram-config.types.ts';
 */

/**
 * List stored queries in stable name order.
 *
 * @param {Record<string, StoredQueryConfig>} stored_queries
 * @returns {{ name: string, where: string }[]}
 */
export function listQueries(stored_queries) {
  return Object.entries(stored_queries)
    .sort(([left_name], [right_name]) => left_name.localeCompare(right_name))
    .map(([name, stored_query]) => ({
      name,
      where: stored_query.where,
    }));
}
