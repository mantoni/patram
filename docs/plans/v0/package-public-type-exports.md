# Package Public Type Exports Plan

- kind: plan
- status: done
- decided_by: docs/decisions/package-public-type-exports.md

## Goal

- Make `import type { ... } from 'patram'` expose stable graph and query result
  contracts for package consumers.

## Scope

- Add package-root public types for graph nodes, graph edges, built graphs,
  project graph load results, query results, and diagnostics.
- Extend package contract coverage to verify the new root type exports.
- Keep the runtime package entrypoint behavior unchanged.

## Order

1. Document the package public type export decision.
2. Add failing package-root and packed-package type coverage.
3. Implement the public type exports in the package declaration surface.
4. Run validation and keep the plan active with the task in a terminal status.

## Acceptance

- TypeScript consumers can import the stable graph and query result types from
  `patram`.
- The public type names describe the current supported runtime result shapes.
- `import { loadProjectGraph, queryGraph } from 'patram'` keeps working.
- `npm run all` passes.
