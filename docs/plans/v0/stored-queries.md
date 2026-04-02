# Stored Queries Plan

- kind: plan
- status: active
- tracked_in: docs/roadmap/v0-dogfood.md
- decided_by: docs/decisions/query-command.md
- decided_by: docs/decisions/query-language.md

## Goal

- Run named queries from `.patram.json`.
- List stored queries from `.patram.json`.
- Keep ad hoc and stored queries on one execution path.

## Scope

- Update the CLI to support `patram query <name>`.
- Add a query-list helper for stable stored query output.
- Add tests for named-query execution and `queries` output.

## Order

1. Add failing CLI and helper tests.
2. Implement stored query lookup and query listing.
3. Run validation.

## Acceptance

- `patram query pending-tasks` runs the `pending-tasks` stored query.
- `patram queries` matches `docs/conventions/cli-output-v0.md` in stable order.
- Missing stored query names fail with a clear error.
- `npm run all` passes.
