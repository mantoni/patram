# Implement Check Link Target Existence

- kind: task
- status: done
- tracked_in: docs/plans/v0/check-link-target-existence.md
- decided_by: docs/decisions/check-link-target-existence.md

- Validate markdown link targets against repo file existence instead of indexed
  files only.
- Preserve repo-root and `.gitignore` boundaries during link validation.
