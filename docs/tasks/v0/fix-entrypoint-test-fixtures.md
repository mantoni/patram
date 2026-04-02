# Stabilize Entrypoint Test Fixtures

- kind: task
- status: done
- tracked_in: docs/plans/v0/fix-entrypoint-test-fixtures.md
- decided_by: docs/decisions/entrypoint-test-fixtures.md

- Use the real `bin/patram.js` path in the entrypoint dispatch test.
- Replace per-test ESM mocking with a hoisted shared CLI mock.
