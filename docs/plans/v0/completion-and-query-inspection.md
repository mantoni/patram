# Completion And Query Inspection Plan

- Kind: plan
- Status: active
- Tracked in: docs/roadmap/v0-dogfood.md
- Decided by: docs/decisions/query-command.md
- Decided by: docs/decisions/query-language.md
- Decided by: docs/decisions/cli-argument-parser.md
- Decided by: docs/decisions/query-inspection.md

## Goal

- Reduce trial-and-error while authoring commands and queries.
- Add shell completion for discoverability at the prompt.
- Add query inspection modes that explain or lint a query without relying on
  full result output.

## Scope

- Add a completion entrypoint such as `patram completion <shell>`.
- Start with command names, options, stored query names, and command-specific
  positional suggestions.
- Add a query inspection mode that resolves stored queries and shows the
  effective where clause and execution options.
- Explain traversal, aggregate predicates, and nested subqueries without
  rendering result sets.
- Add a non-result query validation mode for ad hoc and stored queries.
- Keep normal query execution and output rendering unchanged when inspection is
  not requested.

## Order

1. Record a completion-and-inspection decision that defines supported shells,
   completion entrypoints, and the final inspection flag names.
2. Update the command reference and CLI output convention with completion and
   query-inspection examples.
3. Add failing CLI tests for completion generation, query explanation, and query
   linting flows.
4. Implement completion script generation from CLI command metadata.
5. Implement query inspection helpers that resolve stored queries, parse where
   clauses, explain nested traversal clauses, and print non-result diagnostics.
6. Refactor shared query metadata helpers if needed.
7. Run validation.

## Acceptance

- `patram completion zsh` prints a shell completion script for Patram.
- Completion covers command names, global flags, command flags, and stored query
  names where applicable.
- `patram query ready-tasks --explain` reports the resolved where clause and
  query execution options without changing the query result model.
- `patram query --where "kind=plan and none(in:tracked_in, kind=decision)" --explain`
  reports the nested traversal and aggregate structure without executing the
  result renderers.
- Query inspection works for both stored-query and `--where` inputs.
- Invalid ad hoc or stored queries can be validated without rendering result
  sets.
- `npm run all` passes.
