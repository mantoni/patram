# GitHub Actions Action Upgrades Proposal

- Kind: decision
- Status: accepted
- Tracked in: docs/plans/v0/github-actions-action-upgrades.md

- Upgrade workflow action dependencies from `actions/checkout@v5` to
  `actions/checkout@v6`.
- Upgrade workflow action dependencies from `actions/setup-node@v5` to
  `actions/setup-node@v6`.
- Keep the existing workflow behavior and job structure unchanged apart from the
  action version updates.
- Use `actions/setup-node@v6` in the release workflow to avoid writing the
  deprecated npm `always-auth` config.

## Rationale

- Keep GitHub-hosted workflow dependencies on the current supported major
  releases.
- Remove npm warnings caused by legacy auth config written by
  `actions/setup-node@v5`.
- Limit CI churn by keeping the workflow contracts stable while upgrading the
  underlying actions.
