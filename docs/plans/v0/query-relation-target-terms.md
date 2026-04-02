# Query Relation Target Terms Plan

- kind: plan
- status: active
- tracked_in: docs/roadmap/v0-dogfood.md
- decided_by: docs/decisions/query-relation-target-terms.md

## Goal

- Let `patram query` filter nodes by exact relation target ids such as
  `implements_command=command:query` and `uses_term=term:graph`.

## Scope

- Extend where-clause parsing with one exact relation-target term shape.
- Keep relation-existence terms and field terms unchanged.
- Update graph querying to index relation targets by source node and relation
  name.
- Render stored queries with exact relation-target terms in the canonical
  layout.
- Add parser, query, and repo-level coverage for semantic relation-target
  queries.

## Order

1. Add failing query and rendering tests for exact relation-target terms.
2. Extend where-clause parsing with relation-target clauses.
3. Update query matching to test target node ids.
4. Update stored-query layout to render the new clause shape.
5. Add repo contract coverage for semantic relation-target queries.

## Acceptance

- `patram query --where "implements_command=command:query"` returns
  `lib/patram-cli.js`.
- `patram query --where "uses_term=term:graph"` returns graph-related docs and
  source anchors.
- `not implements_command=command:query` works.
- `implements_command:*` keeps working unchanged.
