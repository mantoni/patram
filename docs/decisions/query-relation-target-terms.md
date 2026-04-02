# Query Relation Target Terms Proposal

- kind: decision
- status: accepted
- tracked_in: docs/plans/v0/query-relation-target-terms.md

- Extend the query language with exact relation-target terms such as
  `implements_command=command:query`.
- Keep existing relation-existence terms such as `implements_command:*`.
- Reuse `not` for negated exact relation-target terms.
- Match relation targets by exact target node id.
- Do not add prefix, substring, or path-based relation-target matching.

## Rationale

- The graph already materializes semantic command and term ids on relation
  edges.
- Agents need a direct way to ask which nodes point to one semantic entity.
- Exact target matching keeps the syntax simple and unambiguous.
- Deferring partial matching avoids adding a second target-query language before
  exact id lookup proves insufficient.
