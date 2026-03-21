# Fix Check Path Targets

- Kind: task
- Status: done
- Tracked in: docs/plans/v0/fix-check-path-targets.md
- Decided by: docs/decisions/check-target-resolution.md

- Make `patram check <path>` work for repo files and subdirectories.
- Keep graph validation scoped to the requested target without weakening
  project-wide link resolution.
