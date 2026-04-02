# Local Cypher Syntax Diagnostics Plan

- Kind: plan
- Status: active
- Tracked in: docs/roadmap/query-language-extensions.md
- Decided by: docs/decisions/local-cypher-syntax-diagnostics.md

## Goal

- Remove the external Cypher syntax-validation dependency while preserving
  Patram's supported Cypher query behavior.

## Scope

- Replace `validateSyntax()` fallback handling with local parser diagnostics.
- Keep tokenizer and parser failures on the existing `query.invalid` diagnostic
  shape.
- Remove unused schema-projection helpers that only served the external
  validator.
- Drop `@neo4j-cypher/language-support` from package metadata and lockfiles.

## Order

1. Record the local-diagnostics decision and implementation plan.
2. Add failing tests for the local parser diagnostic contract.
3. Remove the external validator fallback and any dead support code.
4. Remove the package dependency.
5. Run validation.

## Acceptance

- Malformed Cypher still returns `query.invalid` diagnostics.
- Parser errors report the local Patram parser message and column.
- `package.json` no longer depends on `@neo4j-cypher/language-support`.
- `npm run all` passes.
