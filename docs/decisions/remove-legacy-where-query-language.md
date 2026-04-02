# Remove Legacy Where Query Language

- kind: decision
- status: accepted
- tracked_in: docs/plans/v0/remove-legacy-where-query-language.md
- decided_by: docs/decisions/cypher-query-language.md

- Remove `--where` from the `patram query`, `patram queries`, and `patram refs`
  CLI surfaces.
- Remove stored-query config support for `queries.<name>.where` and require
  `queries.<name>.cypher`.
- Update CLI help, command docs, examples, hints, and validation messages to
  present Cypher as the only supported query language.
- Keep the low-level `parseWhereClause()` and `queryGraph()` package APIs for
  now so package consumers can migrate separately from the CLI and repo-config
  break.

## Rationale

- The accepted Cypher rollout only kept `where` temporarily while the repo
  migrated its stored queries and tests.
- The repo config, stored queries, and primary docs now use Cypher, so the
  remaining `--where` paths only preserve duplicate behavior and stale help.
- Removing the compatibility path clarifies errors and examples, and prevents
  new docs or tests from reintroducing the bespoke query language on the main
  CLI.
- Keeping the package exports avoids coupling this CLI cleanup to a larger
  package-level breaking change.
