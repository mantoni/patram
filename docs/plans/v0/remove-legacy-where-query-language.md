# Remove Legacy Where Query Language Plan

- kind: plan
- status: active
- tracked_in: docs/roadmap/query-language-extensions.md
- decided_by: docs/decisions/remove-legacy-where-query-language.md

## Goal

- Make Cypher the only supported query text for Patram's CLI and stored-query
  config.

## Scope

- Reject `--where` for `query`, `queries add`, `queries update`, and `refs`.
- Reject stored queries that still use `queries.<name>.where`.
- Update query resolution, refs filtering, help text, docs, and examples to use
  Cypher only.
- Keep package-level `parseWhereClause()` and `queryGraph()` compatibility
  unchanged.

## Order

1. Record the breaking CLI and config decision.
2. Add failing tests for removed `--where` entrypoints and legacy stored-query
   config.
3. Update parser validation, query resolution, refs filtering, config schema,
   and diagnostics to require Cypher.
4. Refresh CLI help, product docs, and conventions.
5. Run validation.

## Acceptance

- `patram query --where '<clause>'` is rejected.
- `patram refs <file> --where '<clause>'` is rejected.
- `patram queries add <name> --where '<clause>'` is rejected.
- `patram queries update <name> --where '<clause>'` is rejected.
- Stored queries require `queries.<name>.cypher`.
- CLI docs and hints no longer suggest `--where`.
- `npm run all` passes.
