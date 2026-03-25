# CLI Entrypoint Test Fixtures

- Kind: decision
- Status: accepted
- Tracked in: docs/plans/v0/fix-entrypoint-test-fixtures.md

- Entrypoint dispatch tests must use a real repository path for
  `process.argv[1]`.
- Entrypoint dispatch tests must mock the shared CLI runtime with hoisted Vitest
  mocks instead of late per-test ESM mocks.

## Rationale

- A nonexistent fake entry path can fail `realpath()` before the test reaches
  the CLI assertion.
- `bin/patram.js` imports the shared runtime through a static ESM import, so a
  late `vi.doMock()` is not a stable fixture for that dependency.
- The test should verify entrypoint dispatch, not rely on brittle filesystem and
  module-loader timing.
