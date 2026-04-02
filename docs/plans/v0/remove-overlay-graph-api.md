# Remove overlayGraph API Plan

- kind: plan
- status: done
- decided_by: docs/decisions/remove-overlay-graph-api.md

## Goal

- Remove the unused `overlayGraph` helper from the package and repo entirely.

## Scope

- Update package-root and packed-package tests to reject the removed export.
- Remove source-anchor and taxonomy expectations for
  `lib/graph/overlay-graph.js`.
- Delete the helper implementation, its unit test, and the feature docs that
  introduced it.
- Keep the rest of the package query API unchanged.

## Order

1. Record the breaking-change decision and removal plan.
2. Add failing contract changes for the reduced package and source-graph
   surface.
3. Delete the helper code and the obsolete feature docs.
4. Run targeted checks, then full validation, and mark the plan done.

## Acceptance

- `import('patram')` no longer exposes `overlayGraph`.
- The published tarball no longer contains `lib/graph/overlay-graph.d.ts`.
- Repo source-anchor and term-usage coverage no longer mention the removed
  helper.
- `npm run all` passes.
