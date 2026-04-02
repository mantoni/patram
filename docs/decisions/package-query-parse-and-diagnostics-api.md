# Package Query Parse And Diagnostics API Proposal

- kind: decision
- status: accepted
- tracked_in: docs/plans/v0/package-query-parse-and-diagnostics-api.md

- Expose `parseWhereClause` from the `patram` package root.
- Expose `getQuerySemanticDiagnostics` from the `patram` package root.
- Reuse the existing parser and semantic-diagnostic helpers instead of adding
  package-root wrapper functions.
- Expose stable package-root types for parsed where-clause structures and query
  diagnostic inputs.

## Rationale

- Package consumers should be able to validate and inspect queries without
  importing private internal files.
- Re-exporting the existing helpers keeps downstream query behavior aligned with
  the CLI and `queryGraph`.
- Public parsed-query and diagnostic-input types make the helper contracts
  usable from TypeScript consumers without re-declaring Patram internals.
