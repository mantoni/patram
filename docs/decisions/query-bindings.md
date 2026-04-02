# Query Bindings Proposal

- kind: decision
- status: accepted
- tracked_in: docs/plans/v0/query-bindings.md

- Support explicit query-value bindings in the package query APIs.
- Use `@binding_name` placeholders in bare value positions and list items.
- Resolve bindings before semantic diagnostics and relation-target
  classification.
- Expose bindings through `parseWhereClause(where_clause, { bindings })`.
- Expose bindings through `queryGraph(..., { bindings, limit?, offset? })`.
- Keep field names, relation names, operators, and aggregate names literal.
- Report an error when a query references an explicit binding with no matching
  value.
- Keep CLI query text unchanged and unbound by default.

## Rationale

- Consumers need safe runtime substitution without ad hoc string rewriting.
- Resolving bindings inside Patram keeps package consumers aligned with Patram's
  own parsing and semantic rules.
- An explicit `@binding` marker avoids ambiguity between literal query values
  and symbolic placeholders.
- Limiting bindings to value slots keeps the feature small and predictable.
