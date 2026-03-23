# Query Language Extensions Roadmap

- Kind: roadmap
- Status: active

## Goal

- Extend `patram query` beyond node-local filtering while keeping one
  string-based query language.
- Support worktracking rollups such as implemented decisions, plans, and
  roadmaps.

## Scope

- Relation-scoped subqueries over incoming and outgoing edges.
- Aggregate predicates for matching related nodes.
- Set-membership terms for concise status and kind checks.
- Derived execution summaries in `query` and `show` for worktracking documents.
- No recursive walk syntax in the first pass.
- No grouping.
- No ordering by aggregate values.
- No projection language in the first pass.

## Acceptance

- Query language extensions are documented through decisions and plans for
  syntax and output.
- The first traversal design is sufficient to express worktracking rollups.
- Deferred query-language ideas remain recorded separately for later work.
