# CLI Extra Argument And Stored Query Errors Plan

- kind: plan
- status: active
- tracked_in: docs/roadmap/v0-dogfood.md
- decided_by: docs/decisions/cli-extra-argument-and-stored-query-errors.md

## Goal

- Align extra positional argument and unknown stored query diagnostics with the
  CLI help and error standards.

## Scope

- Replace raw extra-positional messages for `help`, `fields`, `check`, `query`,
  `queries`, `refs`, and `show` with structured invalid-token output.
- Add a dedicated unknown stored query diagnostic with optional `Did you mean`
  recovery.
- Update the canonical CLI help-copy fixtures to freeze the approved output.
- Keep command semantics unchanged outside the new diagnostics.

## Order

1. Record the approved diagnostic contract and fixtures.
2. Add failing parser, CLI, and query-resolution tests for the affected cases.
3. Update parser and runtime error types to carry unexpected-argument and
   unknown-stored-query details.
4. Render command-specific `Usage:` and `Next:` recovery copy from shared
   command metadata.
5. Run validation.

## Acceptance

- `patram help query extra` renders the approved unexpected-argument output.
- `patram fields x`, `patram check a b`, `patram query active-plans extra`,
  `patram queries x`, `patram refs docs/patram.md extra`, and
  `patram show docs/patram.md extra` render the approved unexpected-argument
  output.
- `patram query unknown` renders the approved unknown stored query output with
  optional suggestion recovery.
- `npm run all` passes.
