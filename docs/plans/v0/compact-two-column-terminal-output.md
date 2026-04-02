# Compact Two-Column Terminal Output Plan

- kind: plan
- status: active
- tracked_in: docs/roadmap/v0-dogfood.md
- decided_by: docs/decisions/compact-two-column-terminal-output.md

## Goal

- Make `patram queries`, `patram query`, and `patram refs` denser and more
  consistent with one shared two-column title-row layout plus a two-space
  indented body.

## Scope

- Update the terminal output convention for compact two-column query-family
  rendering.
- Add failing renderer tests for stored queries, query results, refs summaries,
  and TTY-only right-title truncation.
- Refactor shared output layout helpers so `plain` and `rich` keep matching text
  structure.
- Keep `json` output unchanged.

## Order

1. Update the CLI output convention for the new compact layout.
2. Add failing tests for `queries`, `query`, and `refs`, including TTY width
   behavior.
3. Implement the shared compact block layout and metadata flattening.
4. Run targeted validation and then `npm run all`.

## Acceptance

- `patram queries` renders stored queries as two-column title rows with the
  query clause in a two-space indented body.
- `patram query` renders node headers on the left, bracketed metadata on the
  right, and title plus description in a compact body with no internal blank
  lines.
- `patram refs` reuses the same node block layout for the selected node and
  incoming references while keeping relation headings unchanged.
- TTY output truncates only right-title labels.
- Empty metadata does not render as `[]`.
- `plain` and `rich` output keep identical line breaks.
- `npm run all` passes.
