# Stored Query Descriptions Proposal

- kind: decision
- status: accepted
- tracked_in: docs/plans/v0/stored-query-descriptions.md

- Allow stored queries in `.patram.json` to carry an optional `description`
  string alongside `where`.
- Keep stored-query execution and lookup keyed only by query name and `where`.
- Render `patram queries` with the existing name and query-term row first.
- When a stored query has a description, render:
  - one blank line after the query row
  - one indented description line or paragraph block with a four-space indent
  - one blank line before the next stored query row
- Omit the blank lines and description block entirely when a stored query does
  not define a description.
- Emit `json` output as a `queries` array of objects with `name`, `where`, and
  optional `description`.

## Rationale

- Stored queries already act as named workflow entrypoints, so a short
  human-facing description makes the catalog easier to scan.
- Keeping `description` optional preserves the current compact output for repos
  that only want query names and clauses.
- Restricting the new text to `queries` output avoids changing query execution
  semantics or the existing `query <name>` path.
