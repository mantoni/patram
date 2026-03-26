# Package Graph Overlay Helper Plan

- Kind: plan
- Status: done
- Decided by: docs/decisions/package-graph-overlay-helper.md

## Goal

- Make `import { overlayGraph } from 'patram'` compose durable and transient
  graph data into a valid Patram query graph.

## Scope

- Add package-root runtime coverage for the overlay helper export.
- Add failing tests for node merge rules, edge composition, and document-path
  alias preservation.
- Extend the packed-package smoke test to verify the new helper import and
  consumer typing.

## Order

1. Document the graph overlay helper decision.
2. Add failing runtime and packed-package coverage.
3. Implement `overlayGraph` and export it from the package root.
4. Run validation and mark the plan done.

## Acceptance

- `overlayGraph` returns a `BuildGraphResult` compatible with `queryGraph`.
- Overlay nodes can add fields to existing nodes and add new local nodes.
- Document-backed nodes remain resolvable through `document_node_ids` and
  `doc:<path>` aliases after composition.
- `npm run all` passes.
