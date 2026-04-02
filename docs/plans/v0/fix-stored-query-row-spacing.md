# Fix Stored Query Row Spacing Plan

- kind: plan
- status: active
- tracked_in: docs/roadmap/v0-dogfood.md
- decided_by: docs/decisions/stored-query-row-spacing.md

## Goal

- Render `patram queries` with one blank line after every stored query block,
  including queries that do not define a description.

## Scope

- Add failing renderer tests for blank-line separation after stored queries with
  and without descriptions.
- Update the shared stored-query layout so plain and rich output share the new
  spacing behavior.
- Align the stored-query output docs with the revised terminal spacing rule.

## Order

1. Add the failing tests that lock the row-spacing contract.
2. Update the shared stored-query layout to append a blank line after every
   query block.
3. Align the docs and finish validation.

## Acceptance

- `patram queries` renders one blank line after every stored query block in
  `plain` and `rich` output.
- Stored-query descriptions remain attached to the query block they describe.
- `json` output stays unchanged.
- `npx vitest run lib/output/render-output-view-stored-queries.test.js` passes.
- `npm run all` passes.
