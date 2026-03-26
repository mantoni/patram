# Package Query Parse And Diagnostics API Plan

- Kind: plan
- Status: done
- Decided by: docs/decisions/package-query-parse-and-diagnostics-api.md

## Goal

- Make `import { parseWhereClause, getQuerySemanticDiagnostics } from 'patram'`
  work for package consumers.

## Scope

- Add package-root coverage for the new runtime helper exports.
- Extend the packed-package smoke test to verify the new runtime and type
  exports.
- Expose stable package-root type aliases for parsed query structures, query
  sources, and repo config inputs.

## Order

1. Document the package query parse and diagnostics API decision.
2. Add failing package-root and packed-package coverage for the new helpers.
3. Re-export the helpers and public query types from the package root.
4. Run validation and mark the plan done.

## Acceptance

- `parseWhereClause` and `getQuerySemanticDiagnostics` are available from the
  package root.
- TypeScript consumers can inspect parsed query structures with package-root
  type imports.
- The helpers keep using the same parser and semantic validation behavior as the
  CLI and `queryGraph`.
- `npm run all` passes.
