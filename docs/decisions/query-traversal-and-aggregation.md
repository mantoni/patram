# Query Traversal And Aggregation Proposal

- Kind: decision
- Status: accepted
- Tracked in: docs/plans/v0/query-traversal-and-aggregation.md

- Keep one string-based query language for both ad hoc and stored queries.
- Add relation-scoped traversal terms that address one hop of related nodes
  through `in:<relation>` and `out:<relation>`.
- Add aggregate predicates `any(...)`, `none(...)`, and `count(...)` over those
  related nodes.
- Evaluate the nested subquery against each related node using the normal query
  language.
- Add set-membership terms in the form `field in [a, b]` and
  `field not in [a, b]`.
- Keep traversal and aggregation inside `where` so query results stay rooted at
  the original node set.
- Limit the first pass to one-hop traversal and nested subqueries.
- Defer recursive walk syntax, grouping, ordering by aggregate values, and
  projections.

## Semantics

- `in:<relation>` traverses edges where the current node is the target.
- `out:<relation>` traverses edges where the current node is the source.
- `any(...)` is true when at least one related node matches the nested subquery.
- `none(...)` is true when no related nodes match the nested subquery.
- `count(...)` returns the number of related nodes that match the nested
  subquery.
- Nested subqueries may themselves use traversal and aggregate predicates.
- `any(...)` over an empty related set is `false`.
- `none(...)` over an empty related set is `true`.
- `count(...)` over an empty related set is `0`.

## Examples

```txt
kind=decision and none(in:decided_by, kind=task and status not in [done, dropped, superseded])
kind=plan and none(in:tracked_in, kind=task and status not in [done, dropped, superseded])
kind=roadmap and none(in:tracked_in, kind=plan and any(in:tracked_in, kind=task and status not in [done, dropped, superseded]))
count(in:decided_by, kind=task) = 0
```

## Rationale

- This extends the existing string-based query model instead of introducing a
  second query language.
- One-hop nested traversal is enough to express current worktracking rollups.
- Set-membership terms keep nested aggregate queries readable without requiring
  an immediate `or` language.
- Deferring recursive and projection-heavy features keeps the first
  implementation smaller and easier to validate.
