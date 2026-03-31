# Query Management Commands

- Kind: decision
- Status: accepted
- Tracked in: docs/plans/v0/query-management-commands.md
- Decided by: docs/decisions/cli-extra-argument-and-stored-query-errors.md
- Decided by: docs/decisions/query-validation-lifecycle.md
- Decided by: docs/decisions/single-config-file.md

- Add stored-query mutation commands under `patram queries`:
  - `patram queries add <name> --query "<clause>" [--desc "<text>"]`
  - `patram queries update <name> [--name <new_name>] [--query "<clause>"] [--desc "<text>"]`
  - `patram queries remove <name>`
- Treat `--desc` as optional on add and update.
- Treat `--desc ""` on update as a request to remove the stored-query
  description field from config.
- Require `queries add` to fail when the target name already exists.
- Require `queries update` to fail when none of `--name`, `--query`, or `--desc`
  are provided.
- Require `queries update` rename operations to fail when the destination name
  already exists and is different from the source query.
- Reuse the query parser and semantic validation before persisting `--query`
  changes.
- Reuse the existing unknown stored-query diagnostic shape for `queries remove`
  and `queries update` when the source query does not exist.
- Persist changes back into `.patram.json` while preserving unrelated top-level
  config sections.

## Rationale

- Stored queries are a workflow surface in this repo, so common maintenance
  should not require direct JSON editing.
- Mutating `.patram.json` keeps the config transparent and aligned with the
  accepted single-config-file direction.
- Reusing existing validation and missing-query diagnostics keeps mutation
  commands consistent with `patram query <name>`.
