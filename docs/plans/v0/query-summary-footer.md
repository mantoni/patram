# Query Summary Footer Plan

- Kind: plan
- Status: active
- Tracked in: docs/roadmap/v0-dogfood.md
- Decided by: docs/decisions/query-pagination.md
- Decided by: docs/decisions/query-summary-footer.md

## Goal

- Remove the terminal query summary footer when the visible page already shows
  the full result set.

## Scope

- Update the canonical query output convention for full, paginated, and empty
  results.
- Add failing renderer and CLI tests for full-result queries.
- Keep summary output for paginated query pages.
- Preserve existing `json` pagination metadata.

## Order

1. Update the query output convention.
2. Add failing shared-renderer and CLI tests.
3. Implement the footer guard in plain and rich rendering.
4. Run validation.

## Acceptance

- Full-result terminal queries omit `Showing <shown> of <total> matches.`.
- Paginated terminal queries still render the summary footer.
- Empty terminal queries omit the summary footer and keep actionable hints.
- Query `json` output keeps `shown_count`, `total_count`, `offset`, and `limit`.
- `npm run all` passes.
