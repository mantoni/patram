# Stored Query Inline Query-First Layout Plan

- Kind: plan
- Status: active
- Tracked in: docs/roadmap/v0-dogfood.md
- Decided by: docs/decisions/stored-query-inline-query-first.md

## Goal

- Make `patram queries` denser by rendering the query clause on the first row,
  moving the description into the indented body, wrapping long queries per row,
  and removing blank lines between results.

## Scope

- Update the stored-query terminal output convention for the query-first layout.
- Add failing test updates for row-local query wrapping, description placement,
  and compact result spacing.
- Adjust only the `queries` renderer path and keep `query`, `refs`, and JSON
  output unchanged.

## Order

1. Update the stored-query output convention.
2. Add failing test updates for the new row shape and spacing.
3. Update the `queries` plain and rich renderers.
4. Run the required validation and commit as a fixup.

## Acceptance

- `patram queries` renders `<name>  <query>` on the first row.
- Optional descriptions render below as two-space indented body text.
- Long query clauses wrap per row with two-space continuation indent in TTY
  output.
- No blank line appears between adjacent stored query results.
- `plain` and `rich` keep identical line breaks.
- `npm run all` passes.
