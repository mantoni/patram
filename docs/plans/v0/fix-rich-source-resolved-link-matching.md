# Fix Rich Source Resolved Link Matching Plan

- Kind: plan
- Status: active
- Tracked in: docs/roadmap/v0-dogfood.md
- Decided by: docs/decisions/rich-source-resolved-link-matching.md
- Decided by: docs/decisions/markdown-link-claim-scope.md
- Decided by: docs/decisions/source-rendering.md

## Goal

- Keep rich markdown link footnote references aligned with the resolved-link
  summaries from `show-document`.

## Scope

- Add a renderer test for mixed unresolved and resolved markdown links.
- Match resolved-link references only for path-like markdown targets.
- Leave external and fragment-only links unnumbered in rich output.

## Order

1. Add a failing renderer test for a document with both external and resolved
   markdown links.
2. Update the rich markdown link renderer to consume references only for
   path-like targets.
3. Run validation and commit the fix.

## Acceptance

- `npx vitest run lib/render-rich-source.test.js` passes.
- Rich output leaves external and fragment-only markdown links unnumbered.
- Rich output still appends references for resolved local doc links.
- `npm run all` passes.
