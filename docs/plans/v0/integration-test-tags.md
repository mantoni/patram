# Integration Test Tags Plan

- kind: plan
- status: active

## Goal

- Mark slower integration-style tests explicitly with Vitest 4.1 tags.
- Give tagged tests longer timeouts.
- Raise the shared slow-test threshold to better match the slowest supported
  integration-style tests.

## Scope

- Add Vitest tag definitions for `integration` and `smoke`.
- Raise the shared `slowTestThreshold` to `5000ms`.
- Tag the existing slower CLI, pager, git, and package workflow tests.
- Remove test-local timeout literals that are replaced by tag configuration.

## Order

1. Document the tagging decision.
2. Add a failing contract test for the Vitest config and test tags.
3. Update the Vitest config with the shared slow-test threshold and tag-based
   timeouts.
4. Tag the slower integration-style tests.
5. Run validation.

## Acceptance

- Tagged tests run with longer timeout profiles.
- The shared slow-test threshold is high enough that moderate integration-style
  tests do not dominate slow-test reporting.
- `npm run all` passes.
