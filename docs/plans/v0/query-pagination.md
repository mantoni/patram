# Query Pagination Plan

- kind: plan
- status: active
- tracked_in: docs/roadmap/v0-dogfood.md
- decided_by: docs/decisions/query-command.md
- decided_by: docs/decisions/query-pagination.md

## Goal

- Cap default `patram query` output at `25` results.
- Add explicit `--offset` and `--limit` controls.
- Surface shown-versus-total match counts in the shared output pipeline.

## Scope

- Extend CLI argument parsing for query pagination flags.
- Paginate filtered graph results after stable sorting.
- Update `plain`, `rich`, and `json` query rendering with pagination summaries.
- Add a hint only when the default limit truncated results.

## Order

1. Update the canonical query output convention with pagination examples.
2. Add failing parser, query engine, renderer, and CLI tests.
3. Implement query pagination and summary metadata.
4. Refactor shared query output helpers if needed.
5. Run validation.

## Acceptance

- `patram query pending-tasks` shows at most `25` results by default.
- `patram query pending-tasks --offset 25` pages into later matches.
- `patram query pending-tasks --limit 5` changes the page size.
- Query output ends with `Showing <shown> of <total> matches.`.
- Default truncation adds a pagination hint.
- `npm run all` passes.
