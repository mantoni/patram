# Fix Check Path Targets

- kind: task
- status: done
- tracked_in: docs/plans/v0/fix-check-path-targets.md
- decided_by: docs/decisions/check-target-resolution.md

- Make `patram check <path>` work for repo files and subdirectories.
- Keep graph validation scoped to the requested target without weakening
  project-wide link resolution.
