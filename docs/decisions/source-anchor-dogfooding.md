# Source Anchor Dogfooding Proposal

- Kind: decision
- Status: accepted
- Tracked in: docs/plans/v0/source-anchor-dogfooding.md

- Dogfood source-file indexing in this repo through curated JSDoc `@patram`
  anchor blocks.
- Extend the repo scan to include JavaScript files in `bin/`, `lib/`,
  `scripts/`, and `test/`.
- Mirror markdown directive mappings for JSDoc `kind`, `status`, `blocked_by`,
  `decided_by`, `implements`, and `tracked_in`.
- Keep source-anchor `Kind:` values small and stable: `entrypoint`, `cli`,
  `config`, `scan`, `parse`, `graph`, `output`, `support`, and `release`.
- Tag anchor files, not every source file.
- Treat the source-anchor sweep as complete only when every repo area has an
  intentional query anchor or an explicit coverage owner in conventions.
- Use source-anchor titles and descriptions as agent-facing search handles.

## Example

```js
/**
 * Query graph filtering.
 *
 * Applies the v0 where-clause language to materialized graph nodes and keeps
 * query pagination separate from matching.
 *
 * Kind: graph
 * Status: active
 * Tracked in: ../docs/plans/v0/source-anchor-dogfooding.md
 * Decided by: ../docs/decisions/query-language.md
 * Implements: ../docs/tasks/v0/query-command.md
 * @patram
 * @see {@link ./parse-where-clause.js}
 * @see {@link ../docs/patram.md}
 */
```

## Rationale

- Agents need fast query entrypoints for code responsibilities such as command
  flow, graph construction, parsing, and rendering.
- Querying all source files without curation would add scan noise without
  improving search quality.
- Mirrored JSDoc mappings keep markdown and source files on one graph model.
- A coverage-oriented sweep avoids a repo that is useful only in the areas that
  happened to receive tags first.
