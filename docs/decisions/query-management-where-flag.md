# Query Management Where Flag

- kind: decision
- status: accepted
- tracked_in: docs/plans/v0/query-management-where-flag.md
- decided_by: docs/decisions/query-management-commands.md
- decided_by: docs/decisions/query-command.md

- Rename the stored-query mutation clause flag from `--query` to `--where` for
  `patram queries add` and `patram queries update`.
- Treat the rename as a breaking CLI change and remove `--query` compatibility
  from `queries` subcommands.
- Keep `patram query --where '<clause>'` as the canonical ad hoc query syntax
  and align `queries` mutation help and docs to the same clause label.
- Continue to persist the clause into stored query `where` fields and reuse the
  same validation pipeline before saving changes.
- Require `queries add` to fail when `--where` is omitted.
- Require `queries update` to fail when none of `--name`, `--where`, or `--desc`
  are provided.

## Rationale

- `patram query` already uses `--where`, so the old `queries --query` flag made
  the same concept look like two different surfaces.
- The stored-query payload is already named `where`, so matching the flag to the
  persisted field reduces translation overhead in help, tests, and code.
- The user explicitly requested a breaking rename, so carrying an alias would
  preserve the inconsistency without value.
