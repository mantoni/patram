# Fix Check Path Targets Plan

- kind: plan
- status: done
- tracked_in: docs/roadmap/v0-dogfood.md

## Goal

- Make `patram check <path>` work for repo files and subdirectories.

## Scope

- Resolve the repo root for explicit `check` paths by walking ancestor
  directories.
- Scope `check` diagnostics and success summaries to the requested target.
- Preserve full-project link validation when checking a subset.

## Order

1. Document check-target resolution.
2. Add failing tests for file and directory targets.
3. Implement target resolution and scoped diagnostics.
4. Run validation and mark the task complete.

## Acceptance

- `patram check docs/patram.md` does not throw.
- `patram check docs/patram.md` validates only that file and prints a success
  summary for one file when valid.
- `patram check docs` validates only files under `docs/`.
- Broken-link detection still recognizes valid targets elsewhere in the same
  project.
