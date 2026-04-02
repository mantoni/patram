# Package Public Type Exports Proposal

- kind: decision
- status: accepted
- tracked_in: docs/plans/v0/package-public-type-exports.md

- Expose stable package-root type exports for the graph and query result shapes
  returned by the supported `patram` library APIs.
- Keep the public types as aliases of the current runtime-backed structures
  instead of introducing wrapper result objects.
- Treat the exported type names as the supported structural contract for library
  consumers.

## Rationale

- TypeScript consumers should be able to depend on the supported package API
  without re-declaring internal graph and query result shapes locally.
- Re-exporting stable aliases keeps the runtime API unchanged while making the
  public contract clearer.
- Anchoring the public type surface at the package root avoids imports from
  private internal files.
