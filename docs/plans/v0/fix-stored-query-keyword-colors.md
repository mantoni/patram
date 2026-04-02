# Fix Stored Query Keyword Colors Plan

- kind: plan
- status: active
- tracked_in: docs/roadmap/v0-dogfood.md
- decided_by: docs/decisions/stored-query-keyword-colors.md

## Goal

- Keep `patram queries` rich output visually consistent by rendering stored
  query boolean keywords with the same gray styling as other query keywords and
  operators.

## Scope

- Add a failing renderer test for boolean keywords in `queries` rich output.
- Update rich stored-query rendering so parsed keyword segments render gray
  instead of yellow.
- Align the documented rich-output color rules for `queries`.

## Order

1. Add a failing regression test for `and`, `or`, and `not` in rich `queries`
   output.
2. Change stored-query rich rendering to style keyword segments gray.
3. Update the output conventions and finish validation.

## Acceptance

- `patram queries` renders stored query operators and boolean keywords in the
  same gray tone in `rich` output.
- `plain` and `json` output stay unchanged.
- `npx vitest run lib/render-output-view-stored-queries.test.js` passes.
- `npm run all` passes.
