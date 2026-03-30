# Fix Stored Query Description Colors Plan

- Kind: plan
- Status: active
- Tracked in: docs/roadmap/v0-dogfood.md
- Decided by: docs/decisions/stored-query-description-colors.md

## Goal

- Keep `patram queries` rich output visually consistent by rendering optional
  stored-query descriptions as secondary gray text.

## Scope

- Add a failing renderer test for description styling in `queries` rich output.
- Update the stored-query layout/rendering path so description lines render gray
  in `rich` output without changing plain output.
- Align the documented rich-output color rules for `queries`.

## Order

1. Add a failing regression test for description styling in rich `queries`
   output.
2. Change stored-query rich rendering to style description lines gray.
3. Update the output conventions and finish validation.

## Acceptance

- `patram queries` renders optional stored-query descriptions in gray in `rich`
  output.
- `plain` and `json` output stay unchanged.
- `npx vitest run lib/output/render-output-view-stored-queries.test.js` passes.
- `npm run all` passes.
