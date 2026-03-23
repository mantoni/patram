# Query Traversal And Aggregation Plan

- Kind: plan
- Status: active
- Tracked in: docs/roadmap/query-language-extensions.md
- Implements: docs/research/query-language-deferred-features.md
- Decided by: docs/decisions/query-traversal-and-aggregation.md

## Goal

- Extend the string-based query language with relation-scoped traversal and
  aggregate predicates.
- Make worktracking rollups queryable without mutating parent documents.

## Scope

- Add one-hop directional traversal references in the form `in:<relation>` and
  `out:<relation>`.
- Add aggregate predicates `any(...)`, `none(...)`, and `count(...)`.
- Let aggregate predicates accept a nested subquery that reuses the normal query
  language against related nodes.
- Add field set-membership terms such as `status in [done, dropped]` and
  `status not in [pending, blocked]`.
- Keep query results rooted at the original node set.
- Keep traversal cycle handling trivial by limiting the first pass to one hop.
- Keep stored-query support and query rendering aligned with the new syntax.
- Defer recursive walk syntax, grouping, ordering by aggregate values, and
  projections.

## Grammar Sketch

```txt
term :=
  existing_term
  | aggregate_term

aggregate_term :=
  any("(" traversal "," subquery ")")
  | none("(" traversal "," subquery ")")
  | count("(" traversal "," subquery ")") comparison integer

traversal :=
  "in:" relation_name
  | "out:" relation_name

set_term :=
  field_name " in [" value_list "]"
  | field_name " not in [" value_list "]"
```

## Examples

```txt
kind=decision and none(in:decided_by, kind=task and status not in [done, dropped, superseded])
kind=plan and none(in:tracked_in, kind=task and status not in [done, dropped, superseded])
kind=roadmap and none(in:tracked_in, kind=plan and any(in:tracked_in, kind=task and status not in [done, dropped, superseded]))
count(in:decided_by, kind=task) = 0
```

## Order

1. Record a traversal-and-aggregation decision that defines syntax, semantics,
   and first-pass limits.
2. Update the query reference and CLI output conventions with nested-query
   examples.
3. Add failing parser, evaluator, rendering, and repo-level tests for aggregate
   predicates and set-membership terms.
4. Extend where-clause parsing with nested traversal and membership syntax.
5. Extend query evaluation to follow one-hop incoming and outgoing relations and
   evaluate aggregate predicates against related nodes.
6. Update stored-query rendering and query-inspection output for the new syntax.
7. Run validation.

## Acceptance

- `patram query --where "kind=decision and none(in:decided_by, kind=task and status not in [done, dropped, superseded])"`
  returns implemented decisions.
- `patram query --where "kind=plan and none(in:tracked_in, kind=task and status not in [done, dropped, superseded])"`
  returns implemented plans.
- `patram query --where "count(in:decided_by, kind=task) = 0"` returns nodes
  with no related tasks through that relation.
- Set-membership terms work in root and nested subqueries.
- Stored queries preserve and render the new clause shapes unchanged.
- `npm run all` passes.
