# Stabilize Entrypoint Test Fixtures

- Kind: task
- Status: done
- Tracked in: docs/plans/v0/fix-entrypoint-test-fixtures.md
- Decided by: docs/decisions/entrypoint-test-fixtures.md

- Use the real `bin/patram.js` path in the entrypoint dispatch test.
- Replace per-test ESM mocking with a hoisted shared CLI mock.
