# GitHub Actions Checks Plan

- Kind: plan
- Status: active

## Goal

- Add a GitHub Actions workflow for repo validation.
- Run all checks and tests in CI.
- Cover Node.js `22`, `24`, and `25`.

## Scope

- Add a workflow in `.github/workflows/`.
- Install dependencies with npm.
- Use `actions/setup-node` with npm cache enabled.
- Run lint, format, types, unit tests, coverage tests, and duplicate checks as
  separate steps.

## Order

1. Document the CI decision.
2. Add a failing test for the workflow contract.
3. Add the workflow file.
4. Run validation.

## Acceptance

- `.github/workflows/checks.yml` exists.
- The workflow runs on `push` and `pull_request`.
- The workflow uses a Node.js matrix with `22`, `24`, and `25`.
- The workflow enables npm cache in `actions/setup-node`.
- The workflow runs `npm run check:lint` in its own step.
- The workflow runs `npm run check:format` in its own step.
- The workflow runs `npm run check:types` in its own step.
- The workflow runs `npm run test:unit` in its own step.
- The workflow runs `npm run test:coverage` in its own step.
- The workflow runs `npm run check:dupes` in its own step.
