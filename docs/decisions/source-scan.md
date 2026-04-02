# Source Scan Proposal

- kind: decision
- status: accepted
- tracked_in: docs/roadmap/v0-dogfood.md

- Source scanning uses the `.patram.json` `include` globs.
- Globs resolve from the project root.
- Returned file paths stay repo-relative.
- Returned file paths use `/` separators.
- Scan results are unique and lexicographically sorted.

## Rationale

- Config already defines the scan boundary.
- Repo-relative paths match document ids and diagnostics.
- Stable ordering keeps tests and CLI output deterministic.
