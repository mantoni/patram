# Implement Query Summary Footer Rules

- Kind: task
- Status: done
- Tracked in: docs/plans/v0/query-summary-footer.md
- Decided by: docs/decisions/query-pagination.md
- Decided by: docs/decisions/query-summary-footer.md

- Omit the terminal query summary footer when the full result set is already
  visible.
- Keep summary output for paginated terminal queries and preserve JSON
  pagination metadata.
