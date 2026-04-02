# Stabilize Pager Test ANSI Assertions

- kind: task
- status: done
- tracked_in: docs/plans/v0/fix-pager-test-ansi-content-assertions.md
- decided_by: docs/decisions/pager-test-ansi-content-assertions.md

- Strip ANSI sequences before asserting pager text content in CLI tests.
- Keep style-specific assertions only where tests intentionally verify color
  output.
