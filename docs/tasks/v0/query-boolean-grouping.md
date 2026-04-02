# Implement Query Boolean Grouping

- kind: task
- status: done
- tracked_in: docs/plans/v0/query-boolean-grouping.md
- decided_by: docs/decisions/query-boolean-grouping.md

- Add regression coverage for `or` precedence and parenthesized grouping in
  parser, evaluator, and query explanation flows.
- Parse and evaluate grouped boolean expressions in top-level and aggregate
  where clauses.
- Preserve grouped query structure in stored-query rendering and command
  documentation.
