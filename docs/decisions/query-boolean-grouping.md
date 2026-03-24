# Query Boolean Grouping Proposal

- Kind: decision
- Status: accepted
- Tracked in: docs/plans/v0/query-boolean-grouping.md

- Extend the where-clause grammar with the `or` operator.
- Support parentheses for explicit grouping in top-level and nested aggregate
  subqueries.
- Use standard boolean precedence: `not` binds tighter than `and`, and `and`
  binds tighter than `or`.
- Keep aggregate traversal predicates and atomic query terms unchanged.
- Keep whitespace-insensitive parsing around operators and grouping tokens.

## Rationale

- Worktracking and taxonomy queries increasingly need alternative matches
  without repeating long aggregate or relation clauses.
- Standard precedence keeps simple disjunctions readable without forcing
  parentheses on every mixed boolean query.
- Parentheses make the query language predictable when authors need to override
  precedence in stored queries and ad hoc CLI usage.
- Reusing the same grouping rules inside aggregate subqueries keeps the language
  consistent across top-level and nested filters.
