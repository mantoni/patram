# Query Summary Footer Proposal

- Kind: decision
- Status: accepted
- Tracked in: docs/plans/v0/query-summary-footer.md

- Omit the terminal query summary line when a query shows the full result set.
- Treat a query as showing the full result set when `offset` is `0` and
  `total_count <= limit`.
- Keep query pagination metadata in `json` output even when the terminal footer
  is omitted.
- Keep the terminal summary line when pagination changes the visible slice or
  hides additional matches.

## Rationale

- `Showing <shown> of <total> matches.` is useful when output is partial, but it
  repeats visible information when the first page already contains every match.
- Omitting the footer shortens the common single-page query case without hiding
  pagination state from machine-readable output.
