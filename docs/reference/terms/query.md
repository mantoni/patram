# Query

- Term: query
- Term Definition: A graph query that selects Patram nodes by fields, labels,
  and relation patterns.

Stored queries live in `.patram.json`, and ad hoc queries are passed on the CLI.
Patram now treats Cypher as the primary CLI query language while still keeping
the legacy where-clause syntax available for compatibility. Package consumers
can also evaluate parameterized legacy where clauses with explicit
`@binding_name` value placeholders through `parseWhereClause` and `queryGraph`
bindings.
