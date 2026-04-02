# Record GitHub Actions Action Upgrades

- kind: task
- status: done
- tracked_in: docs/plans/v0/github-actions-action-upgrades.md
- decided_by: docs/decisions/github-actions-action-upgrades.md

- Upgrade workflow actions to `actions/checkout@v6` and `actions/setup-node@v6`.
- Keep the checks and release workflow behavior unchanged apart from the action
  version updates.
- Cover the upgraded workflow contract in repo tests.
