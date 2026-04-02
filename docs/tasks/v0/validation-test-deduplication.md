# Deduplicate Validation Test Execution

- kind: task
- status: done
- tracked_in: docs/plans/v0/validation-test-deduplication.md
- decided_by: docs/decisions/validation-test-deduplication.md

- Run coverage once through `npm run all` without duplicating plain test
  execution.
- Keep the documented GitHub Actions matrix and conditional validation steps
  aligned.
