# Single-Quoted Where Examples

- kind: plan
- status: active
- tracked_in: docs/roadmap/v0-dogfood.md
- decided_by: docs/decisions/single-quoted-where-examples.md

## Goal

- Make shell-facing `--where` examples copy-paste safe when they include
  structural fields such as `$class`.

## Scope

- Update canonical help fixtures and CLI help metadata to show single-quoted
  where clauses.
- Update runtime query hints that print a full `patram query --where ...`
  command.
- Align current user-facing reference docs with the same quoting style.

## Order

1. Update fixture-backed tests to expect single-quoted help and hint text.
2. Update help metadata, parse-error labels, and runtime hints to match.
3. Refresh the current docs that present copyable `--where` commands.
4. Run the required validation and commit the change.

## Acceptance

- `patram query --help` and `patram refs --help` show single-quoted `--where`
  examples.
- Empty query result hints suggest `patram query --where '$class=task'`.
- `npm run all` passes.
