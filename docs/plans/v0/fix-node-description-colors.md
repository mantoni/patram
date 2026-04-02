# Fix Node Description Colors Plan

- kind: plan
- status: active
- tracked_in: docs/roadmap/v0-dogfood.md
- decided_by: docs/decisions/node-description-colors.md

## Goal

- Keep compact node lists visually consistent by rendering node descriptions as
  secondary gray text in `rich` output.

## Scope

- Add failing renderer coverage for node description styling in rich `query`,
  `refs`, and `show` output.
- Update the rich node and resolved-link rendering path so description lines
  render gray without changing plain output.
- Align the documented rich-output color rules for node descriptions.

## Order

1. Add failing regression tests for node description styling in rich output.
2. Change rich node and resolved-link rendering to style description lines gray.
3. Update the output conventions and finish validation.

## Acceptance

- `patram query`, `patram refs`, and `patram show` render node description lines
  in gray in `rich` output.
- `plain` and `json` output stay unchanged.
- `npx vitest run lib/output/render-output-view.test.js` passes.
- `npm run all` passes.
