# Stored Query Hanging Indent Wrap Proposal

- kind: decision
- status: accepted
- tracked_in: docs/plans/v0/stored-query-hanging-indent-wrap.md

- Amend the stored-query query-first layout for `patram queries` wrapping.
- In TTY output, when a stored query clause wraps, continuation lines must use a
  hanging indent aligned with the start of the first-line query clause:
  - the first line uses `<name>  <query>`
  - continuation lines start under the first query character, not under a fixed
    two-space indent
- Keep description body rows indented by two spaces.
- Keep non-TTY output unwrapped.

## Rationale

- A hanging indent preserves the visual association between the stored query
  name and its wrapped clause.
- Aligning continuation lines with the start of the clause makes the wrapped
  boolean structure easier to scan than resetting to a generic body indent.
