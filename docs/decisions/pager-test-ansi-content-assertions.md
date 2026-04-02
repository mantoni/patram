# Pager Test ANSI Content Assertions

- kind: decision
- status: accepted
- tracked_in: docs/plans/v0/fix-pager-test-ansi-content-assertions.md

- Strip ANSI sequences from pager output in CLI tests before asserting textual
  content.
- Keep raw ANSI assertions only when a test is explicitly verifying color or
  style output.

## Rationale

- Pager output for TTY commands is rendered through the rich renderer and may
  include ANSI styling when color is enabled.
- Content assertions for headings and resolved-link lines should stay stable
  across color-capable and color-disabled environments.
- Tests that care about text presence should verify text, not terminal escape
  placement.
