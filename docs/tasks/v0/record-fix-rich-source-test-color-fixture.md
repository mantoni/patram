# Record Fix Rich Source Test Color Fixture

- Kind: task
- Status: done
- Tracked in: docs/plans/v0/fix-rich-source-test-color-fixture.md
- Decided by: docs/decisions/rich-source-test-color-fixture.md

- Use a fixed `Ansis(3)` fixture for ANSI-sensitive rich-source assertions.
- Keep renderer behavior unchanged while stabilizing color-specific tests.
- Preserve plain-text rich-source assertions based on stripped output.
