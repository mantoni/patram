/**
 * Query graph filtering.
 *
 * Applies the v0 where-clause language to graph nodes and keeps pagination
 * separate from matching.
 *
 * Kind: graph
 * Status: active
 * Uses Term: ../../docs/reference/terms/graph.md
 * Uses Term: ../../docs/reference/terms/query.md
 * Tracked in: ../../docs/plans/v0/source-anchor-dogfooding.md
 * Decided by: ../../docs/decisions/query-language.md
 * Implements: ../../docs/tasks/v0/query-command.md
 * @see {@link ../../docs/decisions/query-language.md}
 * @patram
 * @see {@link ./load-project-graph.js}
 */

export { DEFAULT_QUERY_LIMIT, queryGraph } from './query/execute.js';
