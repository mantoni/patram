# Fix Wrapped List-Item Directive Continuations Plan

- kind: plan
- status: done
- tracked_in: docs/roadmap/v0-dogfood.md
- decided_by: docs/decisions/wrapped-list-item-directive-continuations.md
- decided_by: docs/decisions/markdown-node-descriptions.md

## Goal

- Keep wrapped markdown list-item directives intact so command metadata stays
  whole and wrapped continuation lines do not leak into document descriptions.

## Scope

- Add failing parser coverage for wrapped list-item directive values.
- Add failing markdown-description coverage for wrapped directive continuation
  lines after a heading title.
- Update markdown directive and prose parsing so wrapped continuation lines stay
  attached to the directive block.

## Order

1. Add failing regression tests for wrapped list-item directives and description
   suppression.
2. Update markdown directive parsing to collect wrapped list-item continuation
   lines.
3. Reuse the wrapped directive parsing in markdown description extraction.
4. Run validation and mark the plan done.

## Acceptance

- Wrapped `- Key: Value` directives emit one directive claim with the joined
  full value.
- Wrapped list-item directive continuation lines do not become
  `document.description`.
- `npx vitest run lib/parse/markdown/parse-markdown-claims.test.js` passes.
- `npx vitest run lib/parse/markdown/parse-markdown-directives.test.js` passes.
- `npm run all` passes.
