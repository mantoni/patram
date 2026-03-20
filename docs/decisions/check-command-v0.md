# Check Command v0 Proposal

- Kind: decision
- Status: accepted
- Tracked in: docs/roadmap/v0-dogfood.md

- Command name: `check`.
- `check` defaults to the current working directory.
- `check` prints diagnostics to standard error.
- `check` prints one diagnostic per line.
- `check` exits `1` when diagnostics exist.
- `check` exits `0` when no diagnostics exist.
- Config diagnostics stop the run before file scanning.
- v0 validates `links_to` targets against scanned document paths.
- v0 reports graph edges that reference missing nodes.

## Rationale

- Config failures should stay low-noise and block follow-on work.
- Broken links are the minimum useful repo check in v0.
- Missing graph nodes indicate an internal consistency problem worth surfacing.
