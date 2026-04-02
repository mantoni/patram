# Test Layout Proposal

- kind: decision
- status: accepted
- tracked_in: docs/plans/v0/test-layout.md

- Keep implementation-coupled tests next to their `lib` modules.
- Move repo-level contract tests out of `lib/` and into a top-level `test/`
  directory.
- Use flat `it(...)` tests without `describe(...)` wrappers.

## Rationale

- Keep `lib/` focused on runtime modules and their adjacent tests.
- Make repo-level checks easier to find by separating them from library code.
- Match the repo's existing preference for direct, flat test structure.
