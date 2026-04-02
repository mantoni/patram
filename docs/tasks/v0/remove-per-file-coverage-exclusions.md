# Remove Per-File Coverage Exclusions

- kind: task
- status: in_progress
- tracked_in: docs/plans/v0/remove-per-file-coverage-exclusions.md
- decided_by: docs/decisions/per-file-coverage-thresholds.md

- Add coverage for the files currently excluded from the per-file gate.
- Remove the temporary exclusions from `vitest.config.js`.
- Keep `npm run test:coverage` and `npm run all` green without the exclusions.
