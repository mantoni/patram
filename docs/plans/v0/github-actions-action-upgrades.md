# GitHub Actions Action Upgrades Plan

- kind: plan
- status: active
- decided_by: docs/decisions/github-actions-action-upgrades.md

## Goal

- Upgrade all GitHub workflow action dependencies in the repo to their current
  major versions.

## Scope

- Update `.github/workflows/checks.yml`.
- Update `.github/workflows/release.yml`.
- Extend the existing workflow contract tests to assert the upgraded action
  versions.
- Preserve the current CI and release behavior aside from the dependency
  upgrades.

## Order

1. Document the action version upgrade decision.
2. Add failing workflow contract assertions for the upgraded action versions.
3. Update the workflow files to satisfy the new contract.
4. Run targeted tests and full repo validation.

## Acceptance

- All workflow `uses:` references point at the upgraded action versions.
- The checks workflow still uses the documented Node.js matrix and validation
  steps.
- The release workflow still publishes to npm and creates the GitHub release.
- The workflow contract tests cover the action version expectations.
