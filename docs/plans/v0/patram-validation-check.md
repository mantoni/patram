# Patram Validation Check Plan

- kind: plan
- status: active

## Goal

- Fix the current `patram check` failure.
- Add a dedicated npm script for Patram validation.
- Run that validation as a separate CI step.

## Scope

- Correct the broken decision-link path in the package install smoke test.
- Add `check:patram` to `package.json`.
- Include `npm run check:patram` in `npm run all`.
- Add a dedicated `npm run check:patram` step to `.github/workflows/checks.yml`.
- Update contract tests for the package scripts and checks workflow.

## Order

1. Document the validation decision.
2. Add failing contract tests for package scripts and CI.
3. Fix the broken Patram link and wire the new script into package scripts and
   CI.
4. Run validation.

## Acceptance

- `patram check` passes in the repo.
- `package.json` defines `check:patram` as `patram check`.
- `npm run all` includes `npm run check:patram`.
- The checks workflow runs `npm run check:patram` in its own step.
- `npm run all` passes.
