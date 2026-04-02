# Query Pagination Proposal

- kind: decision
- status: accepted
- tracked_in: docs/roadmap/v0-dogfood.md

- `patram query` defaults to `25` results.
- `patram query` accepts `--offset <number>`.
- `patram query` accepts `--limit <number>`.
- Apply pagination after filtering and stable result ordering.
- Render a terminal summary line as `Showing <shown> of <total> matches.`.
- When the default limit hides more results and the user did not set `--offset`
  or `--limit`, render a pagination hint.
- Keep `plain`, `rich`, and `json` aligned on the same pagination metadata.

## Rationale

- The repo already has enough queryable documents to make unbounded output
  noisy.
- Explicit pagination keeps ad hoc and stored queries on one command path.
- A shown-versus-total summary makes truncated output obvious.
- The hint preserves discoverability without adding noise to every query.
