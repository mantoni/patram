# Patram Validation Check Proposal

- kind: decision
- status: accepted
- tracked_in: docs/plans/v0/patram-validation-check.md

- Add `npm run check:patram` as the dedicated repository command for
  `patram check`.
- Include `npm run check:patram` in `npm run all`.
- Run `npm run check:patram` in its own GitHub Actions checks step.
- Fix broken Patram doc links as part of that validation wiring.

## Rationale

- `patram check` is the repo's own structure and link validation command, so it
  should be visible in package scripts and CI.
- A dedicated script keeps local, release, and CI validation aligned on the same
  command name.
- A separate CI step makes Patram-specific failures easier to locate than
  folding them into another command.
