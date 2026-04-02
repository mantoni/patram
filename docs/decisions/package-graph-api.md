# Package Graph API Proposal

- kind: decision
- status: accepted
- tracked_in: docs/plans/v0/package-graph-api.md

- Expose `loadProjectGraph` from the `patram` package root.
- Expose `queryGraph` from the `patram` package root.
- Reuse the existing graph helper contracts instead of adding package-root
  wrapper functions.
- Keep the package root as the single programmatic entrypoint for supported
  library APIs.

## Rationale

- Package consumers should be able to build and query a project graph without
  importing private internal files.
- The existing helpers already implement the requested project-graph loading and
  where-clause query behavior.
- Re-exporting the existing helpers keeps the public API small and avoids
  introducing duplicate adapter logic.
