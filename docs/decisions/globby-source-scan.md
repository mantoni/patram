# Globby Source Scan Proposal

- kind: decision
- status: accepted
- tracked_in: docs/plans/v0/globby-source-scan.md

- Source scanning uses `globby` for file discovery.
- Source scanning uses `globby` for `.gitignore` handling.
- Patram no longer maintains a custom `.gitignore` parser.
- Scan results stay repo-relative, unique, and lexicographically sorted.

## Rationale

- `.gitignore` semantics are broader than the current test coverage.
- Maintaining Git-compatible ignore parsing in-house is easy to get wrong.
- `globby` already supports nested `.gitignore` files and negation handling.
- Reusing a maintained library reduces semantic drift and future bug surface.
