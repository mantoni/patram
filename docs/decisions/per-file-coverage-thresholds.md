# Per-File Coverage Thresholds

- kind: decision
- status: accepted
- tracked_in: docs/plans/v0/per-file-coverage-thresholds.md

- Enable `test.coverage.thresholds.perFile` in `vitest.config.js`.
- Keep the default per-file gate at `90` statements, `80` branches, `90`
  functions, and `90` lines.
- Add focused regression tests for helper modules that are already close to the
  default threshold.
- Add explicit file-level coverage exclusions only for larger legacy modules
  that are still below the default gate after targeted test additions.

## Rationale

- The previous global threshold allowed heavily used parser and query modules to
  stay below the target while the aggregate report still passed.
- Turning on `perFile` without any follow-up work fails a wide set of files at
  once, which is too broad for a single corrective change.
- Small helper modules that are already near the default gate should be raised
  with tests now because they give immediate value and keep the stricter gate
  honest.
- Larger legacy modules still benefit from coverage reporting, but they need a
  staged ratchet instead of an all-at-once threshold jump, so this change keeps
  them out of the strict per-file gate until follow-up coverage work lands.
