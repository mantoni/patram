# Query Language Deferred Features

- kind: idea
- status: planned

- Capture future query-language work that should stay outside the first
  traversal and aggregation design.
- Revisit these items after one-hop traversal, aggregate predicates, and
  worktracking rollups exist in the query language.

## Deferred Topics

- General recursive walk syntax such as `*`.
- Ordering by aggregate values.
- Arbitrary projections in the first traversal pass.

## Why Deferred

- The first traversal design only needs relation-scoped subqueries to support
  worktracking rollups.
- Deferring broader query-language features keeps the first implementation
  smaller and easier to explain.
