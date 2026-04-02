# CI Entrypoint Invocation Plan

- kind: plan
- status: active

## Goal

- Fix CI failures caused by invoking `patram` as a bare shell command.
- Keep repository validation and release automation aligned on one shared npm
  script.

## Scope

- Add a decision record for direct entrypoint invocation in repo automation.
- Update package-script contract coverage to require `./bin/patram.js check`.
- Change `package.json` so `check:patram` invokes the local entrypoint.

## Order

1. Record the decision and implementation plan.
2. Update the contract test to assert the direct entrypoint path.
3. Change the npm script and run validation.

## Acceptance

- `package.json` defines `check:patram` as `./bin/patram.js check`.
- `npm run check:patram` succeeds in the repo without relying on a global
  `patram` command.
- `npm run all` passes.
