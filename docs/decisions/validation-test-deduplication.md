# Validation Test Deduplication Proposal

- kind: decision
- status: accepted
- tracked_in: docs/plans/v0/validation-test-deduplication.md

- Keep `npm test` as the fast developer entrypoint for a plain Vitest run.
- Change `npm run all` to run `npm run test:coverage` instead of running both
  `npm run test` and `npm run test:coverage`.
- Keep release validation on `npm run all`.
- Keep GitHub Actions checks in one matrix job on Node.js `22`, `24`, and `25`.
- Run lint, format, types, Patram, coverage, and duplicate checks only on the
  Node.js `24` matrix entry.
- Run plain unit tests on every matrix entry.

## Rationale

- `vitest run --coverage` already executes the test suite, so adding a plain
  `vitest run` in the same full-validation command duplicates the same work.
- Full validation should stay strict, but it should not pay for the same test
  execution twice.
- Coverage collection is more expensive than a plain test run, so it should stay
  on a single primary CI environment rather than every Node.js version in the
  matrix.
- Keeping one job avoids duplicating checkout, Node setup, and dependency
  installation while still preserving cross-version test coverage.
