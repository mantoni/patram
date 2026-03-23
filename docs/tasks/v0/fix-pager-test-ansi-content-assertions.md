# Stabilize Pager Test ANSI Assertions

- Kind: task
- Status: done
- Tracked in: docs/plans/v0/fix-pager-test-ansi-content-assertions.md
- Decided by: docs/decisions/pager-test-ansi-content-assertions.md

- Strip ANSI sequences before asserting pager text content in CLI tests.
- Keep style-specific assertions only where tests intentionally verify color
  output.
