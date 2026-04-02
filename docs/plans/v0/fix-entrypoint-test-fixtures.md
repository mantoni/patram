# Fix Entrypoint Test Fixtures

- kind: plan
- status: active
- decided_by: docs/decisions/entrypoint-test-fixtures.md

## Goal

- Make `bin/patram-entrypoint.test.js` deterministic in local runs and CI.

## Scope

- Replace the fake entrypoint path with the real `bin/patram.js` path from the
  repository checkout.
- Replace late per-test runtime mocking with a hoisted shared CLI mock.
- Keep the production CLI entrypoint logic unchanged.

## Order

1. Record the decision and implementation plan.
2. Update the entrypoint test fixtures to use a real path and hoisted mock.
3. Run targeted validation, then run the required full validation.

## Acceptance

- `npx vitest run bin/patram-entrypoint.test.js` passes consistently.
- The entrypoint test does not mock `node:fs/promises`.
- `npm run all` passes.
