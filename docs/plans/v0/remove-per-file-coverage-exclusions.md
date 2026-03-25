# Remove Per-File Coverage Exclusions

- Kind: plan
- Status: active
- Decided by: docs/decisions/per-file-coverage-thresholds.md

## Goal

- Remove the temporary per-file coverage exclusions from `vitest.config.js`.
- Raise every currently excluded file to the default per-file thresholds.

## Scope

- Add regression coverage for the currently excluded runtime modules and the CLI
  entrypoint.
- Keep runtime behavior unchanged unless a minimal fix is required to make an
  uncovered branch testable.
- Remove the explicit coverage exclusions once the covered files satisfy the
  configured thresholds.

## Order

1. Record the follow-up plan and task.
2. Add failing coverage tests for the currently excluded files in small batches.
3. Apply only the minimal production changes required to support those tests.
4. Remove the temporary exclusions from `vitest.config.js`.
5. Run repository validation and commit the change.

## Acceptance

- `vitest.config.js` no longer excludes the temporary per-file coverage list.
- Each previously excluded file meets the default thresholds: `90` statements,
  `80` branches, `90` functions, and `90` lines.
- `npm run test:coverage` passes without file-level exclusions for those
  modules.
- `npm run all` passes.
