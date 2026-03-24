# Query Boolean Grouping Plan

- Kind: plan
- Status: active
- Tracked in: docs/roadmap/v0-dogfood.md
- Decided by: docs/decisions/query-language.md
- Decided by: docs/decisions/query-boolean-grouping.md

## Goal

- Let `patram query` express boolean alternatives with predictable precedence
  and explicit grouping.

## Scope

- Parse `or` expressions and parenthesized subexpressions in where clauses.
- Apply the same boolean grammar inside aggregate traversal subqueries.
- Evaluate grouped boolean expressions in query execution and semantic linting.
- Render and explain grouped stored queries without flattening away structure.
- Update query reference docs and help examples to describe the new grammar.

## Order

1. Record the boolean-grouping decision and work item.
2. Add failing tests for parsing, evaluation, explanation, and stored-query
   rendering with `or` and parentheses.
3. Refactor the parsed query model from flat conjunctions to boolean
   expressions.
4. Update query execution, semantic diagnostics, and output helpers to walk the
   new expression tree.
5. Align the command docs and help examples with the supported syntax.
6. Run validation and finish the task.

## Acceptance

- `patram query --where "$class=task or status=done"` parses and executes.
- Mixed boolean queries follow `not` > `and` > `or` precedence.
- Parentheses override default precedence at the top level and inside aggregate
  subqueries.
- `patram query ... --explain` preserves grouped boolean structure in plain and
  rich output.
- `patram queries` renders grouped stored queries without dropping parentheses.
- `npm run all` passes.
