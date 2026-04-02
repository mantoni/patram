# Package Graph API Plan

- kind: plan
- status: done
- decided_by: docs/decisions/package-graph-api.md

## Goal

- Make `import { loadProjectGraph, queryGraph } from 'patram'` work for package
  consumers.

## Scope

- Add package-root coverage for the graph helper exports.
- Extend the packed-package smoke test to verify the new root exports.
- Re-export `loadProjectGraph` and `queryGraph` from `lib/patram.js`.

## Order

1. Document the package graph API decision.
2. Add failing tests for the package root exports and packed package import.
3. Re-export the graph helpers from the package root.
4. Run validation and mark the plan done.

## Acceptance

- `import { loadProjectGraph, queryGraph } from 'patram'` works in a consumer
  project after installing the packed tarball.
- The package root keeps exposing the tagged fenced block helpers.
- `npm run all` passes.
