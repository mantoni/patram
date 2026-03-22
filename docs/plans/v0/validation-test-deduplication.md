# Validation Test Deduplication Plan

- Kind: plan
- Status: active

## Goal

- Remove duplicate test execution from full repository validation.
- Keep release validation on the shared full-validation entrypoint.
- Preserve Node.js compatibility coverage in GitHub Actions.
- Avoid duplicate CI setup and install work.

## Scope

- Add a decision record for the validation split.
- Update package-script contract coverage for `npm run all`.
- Update GitHub Actions contract coverage for the conditional-step job layout.
- Change `package.json` so `npm run all` runs coverage once.
- Keep `.github/workflows/checks.yml` as one matrix job with conditional steps.

## Order

1. Document the decision.
2. Add failing contract tests for package scripts and CI.
3. Update package scripts and the checks workflow.
4. Run validation.

## Acceptance

- `npm test` remains available as `vitest run`.
- `npm run test:coverage` remains available as `vitest run --coverage`.
- `npm run all` includes `npm run test:coverage`.
- `npm run all` does not include `npm run test`.
- `.github/workflows/checks.yml` defines one matrix job on Node.js `22`, `24`,
  and `25`.
- The matrix job runs lint, format, types, Patram, coverage, and duplicate
  checks in separate conditional steps for the Node.js `24` entry.
- The matrix job runs `npm run test` for every Node.js entry.
