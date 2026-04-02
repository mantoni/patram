# Stored Query Inline Query-First Layout Proposal

- kind: decision
- status: accepted
- tracked_in: docs/plans/v0/stored-query-inline-query-first.md

- Narrow the compact query-family title-row rules for `patram queries` only.
- Render each stored query block as:
  - the stored query name plus the rendered query clause on the first visual row
  - the optional description in a two-space indented body row
- Remove blank lines between adjacent stored query results.
- In TTY output, wrap long stored query clauses per row instead of using a
  shared column layout:
  - the first line uses `<name>  <query>`
  - continuation lines are indented by two spaces
- Outside TTY output, keep stored query rows unwrapped.
- Keep `rich` styling for parsed query operators and boolean keywords.
- Keep `json` output unchanged.

## Rationale

- The stored query clause is the primary payload of `patram queries`, so it
  should stay on the first row with the query name.
- Per-row wrapping avoids reintroducing a visual column grid while still keeping
  long queries readable in TTY output.
- Removing blank lines makes the listing denser without losing scanability when
  the description moves into the indented body.
