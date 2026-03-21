# Rich Source Test Color Fixture

- Kind: decision
- Status: accepted
- Tracked in: docs/plans/v0/fix-rich-source-test-color-fixture.md

- Use a fixed `Ansis(3)` instance in rich-source tests when asserting ANSI
  styled output.
- Do not build ANSI expectations from the ambient `ansis` singleton in tests
  that verify renderer-owned color output.
- Keep plain-text assertions based on stripped output unchanged.

## Rationale

- The rich-source renderer creates its own `Ansis` instance with a fixed color
  level.
- The ambient `ansis` singleton depends on the current process environment and
  can change expectations between shells, terminals, and CI jobs.
- Tests should assert renderer behavior, not the local terminal color
  auto-detection path.
