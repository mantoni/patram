# Query Management Commands Plan

- Kind: plan
- Status: active
- Tracked in: docs/roadmap/v0-dogfood.md
- Decided by: docs/decisions/query-command.md
- Decided by: docs/decisions/query-language.md
- Decided by: docs/decisions/single-config-file.md

## Goal

- Manage stored queries through `patram` instead of requiring direct JSON
  editing for common tasks.
- Keep stored queries transparent by continuing to persist them in
  `.patram.json`.
- Validate query names and where clauses at the point of change.

## Scope

- Add stored-query management commands under `patram queries`.
- Cover create, show, update, rename, remove, and validate operations.
- Reuse the existing query parser and config loader for validation.
- Preserve unrelated config sections and existing command execution behavior.
- Keep `.patram.json` as the single source of truth.

## Order

1. Record a query-management decision that defines the subcommand surface,
   update semantics, overwrite rules, and config-write expectations.
2. Update the command reference and CLI output convention with management
   command examples.
3. Add failing CLI and config-write tests for adding, updating, renaming,
   removing, showing, and validating stored queries.
4. Implement stored-query mutation helpers that preserve the rest of the config
   file.
5. Wire new `queries` subcommands into the CLI and validation flow.
6. Refactor shared query-config helpers if needed.
7. Run validation.

## Acceptance

- `patram queries add <name> --where "<clause>"` writes a new stored query.
- `patram queries show <name>` prints the stored query definition.
- `patram queries update <name> --where "<clause>"` changes an existing query.
- `patram queries rename <name> <new_name>` renames a stored query.
- `patram queries remove <name>` deletes a stored query.
- `patram queries validate` reports invalid stored query names or where clauses.
- Existing `patram query <name>` and `patram queries` behavior stays intact.
- `npm run all` passes.
