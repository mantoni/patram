# Query Inspection Proposal

- kind: decision
- status: accepted
- tracked_in: docs/plans/v0/completion-and-query-inspection.md

- Keep query inspection on `patram query` instead of adding a separate command.
- Use `--explain` to print resolved query metadata and the parsed clause tree
  without executing result rendering.
- Use `--lint` to validate ad hoc and stored queries without executing the
  result renderers.
- Run lint checks before explanation so `--explain` fails fast on invalid nested
  traversal or relation clauses.
- In lint mode, validate parsed relation references against configured relation
  names, including nested traversal clauses.
- Keep normal query execution unchanged when neither inspection flag is set.

## Explain

- Resolve stored query names before explaining.
- Report the final `where` clause plus the effective `offset` and `limit`.
- Render aggregate predicates with their traversal and nested subquery clauses.
- Keep the explanation output readable in plain text and structured in JSON.

## Lint

- Reuse parse diagnostics for syntax failures.
- Add relation-name diagnostics for relation existence terms, relation-target
  terms, and traversal clauses.
- Report lint diagnostics with the normal Patram diagnostic layout.
- Use `<query>` for ad hoc query diagnostics and `<query:<name>>` for stored
  query diagnostics.
