# Query Management Where Flag Plan

- Kind: plan
- Status: active
- Tracked in: docs/roadmap/v0-dogfood.md
- Decided by: docs/decisions/query-management-where-flag.md

## Goal

- Align `patram queries` stored-query mutation flags with
  `patram query --where`.

## Scope

- Update parser validation, command argument construction, and mutation parsing
  to require `--where` for `queries add` and `queries update`.
- Remove `--query` acceptance from the `queries` command surface.
- Refresh CLI help, command reference docs, and tests to reflect the rename.

## Order

1. Record the breaking rename decision.
2. Add failing parser, help, and command tests for `--where`.
3. Update the CLI implementation and command docs.
4. Run validation.

## Acceptance

- `patram queries add <name> --where "<clause>"` succeeds.
- `patram queries update <name> --where "<clause>"` succeeds.
- `patram queries add <name> --query "<clause>"` is rejected.
- Help and reference docs show `--where` for stored-query mutation commands.
- `npm run all` passes.
