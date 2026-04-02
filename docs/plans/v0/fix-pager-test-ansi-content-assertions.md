# Fix Pager Test ANSI Content Assertions

- kind: plan
- status: active
- tracked_in: docs/roadmap/v0-dogfood.md
- decided_by: docs/decisions/pager-test-ansi-content-assertions.md

## Goal

- Make pager-path CLI tests deterministic across terminals with and without ANSI
  color output.

## Scope

- Update the TTY show pager test in `bin/patram.test.js` to assert on stripped
  text content.
- Keep the CLI pager and renderer behavior unchanged.

## Order

1. Record the decision and plan.
2. Strip ANSI from the captured pager output in the test.
3. Run the pager test under default and color-capable environments.
4. Run the required validation and create a fixup commit.

## Acceptance

- `bin/patram.test.js` passes in the current environment.
- The pager test also passes with `TERM=xterm-256color` and `NO_COLOR` unset.
- `npm run all` passes.
