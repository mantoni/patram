# Add Pre-Push Fixup Check

- kind: task
- status: done
- tracked_in: docs/plans/v0/pre-push-fixup-check.md
- decided_by: docs/decisions/pre-push-fixup-check.md

- Add a repo-managed pre-push hook for fixup and squash commit detection.
- Block pushes that still contain unsquashed fixup history.
