# Per-File Coverage Thresholds Plan

- Kind: plan
- Status: active

## Goal

- Adopt per-file coverage enforcement in Vitest.
- Raise coverage for smaller helper modules that are already close to the
  default thresholds.
- Keep `npm run test:coverage` green with documented temporary exclusions for
  the remaining legacy modules.

## Scope

- Add the decision record for per-file coverage adoption.
- Add regression tests for low-diff helper modules.
- Update `vitest.config.js` to enable `perFile`.
- Add narrowly scoped coverage exclusions for the remaining legacy files.

## Order

1. Document the decision and plan.
2. Add failing regression tests for near-threshold modules.
3. Update coverage thresholds and any required module tests.
4. Run repository validation.

## Acceptance

- `npm run test:coverage` passes with `coverage.thresholds.perFile=true`.
- Helper modules touched in this change meet the default per-file threshold.
- Legacy modules that still fall short have explicit file-level exclusions in
  `vitest.config.js`.
- `npm run all` passes.
