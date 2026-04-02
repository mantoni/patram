# Compact Title Row Inline Right-Part Plan

- kind: plan
- status: active
- tracked_in: docs/roadmap/v0-dogfood.md
- decided_by: docs/decisions/compact-title-row-inline-right-part.md

## Goal

- Simplify the compact query-family title row by rendering the right part inline
  after the title instead of aligning a second column.

## Scope

- Update the CLI output convention for inline right-part title rows.
- Add failing test updates for non-aligned title rows and bracket-preserving TTY
  truncation with `…`.
- Adjust the shared compact title helper without changing JSON output or the
  compact body layout.

## Order

1. Update the output convention for inline right-part title rows.
2. Add failing test updates for the revised row shape and truncation.
3. Update the shared compact title helper and keep renderer structure intact.
4. Run the required validation and commit as a fixup.

## Acceptance

- `queries`, `query`, and `refs` render title rows as `left-title  right-part`
  without left-column padding.
- TTY truncation still affects only the right part.
- Truncated bracketed metadata uses `…` and keeps the closing bracket.
- `plain` and `rich` keep identical line breaks.
- `npm run all` passes.
