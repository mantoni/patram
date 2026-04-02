# Fix Query Inspection Rich Output

- kind: plan
- status: active
- tracked_in: docs/roadmap/v0-dogfood.md
- decided_by: docs/decisions/query-inspection.md

## Goal

- Keep `patram query --explain` working in rich terminal output mode.

## Scope

- Add a regression test for rich query-inspection rendering.
- Replace the broken ANSI callback binding in query-inspection formatting.
- Keep plain and JSON inspection output unchanged.

## Order

1. Add a failing test for rich `--explain` rendering.
2. Fix query-inspection rich label and header styling.
3. Run the required validation and commit the change.

## Acceptance

- Rich `renderQueryInspection()` output renders without throwing.
- `patram query ideas --explain` works in a color-capable TTY.
- `npm run all` passes.
