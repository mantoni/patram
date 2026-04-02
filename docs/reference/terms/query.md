# Query

- Term: query
- Term Definition: A graph query that selects Patram nodes by fields, labels,
  and relation patterns.

Stored queries live in `.patram.json`, and ad hoc queries are passed on the CLI.
Patram uses Cypher for CLI queries and stored-query config. Package consumers
can still evaluate parameterized legacy where clauses with explicit
`@binding_name` value placeholders through `parseWhereClause` and `queryGraph`
bindings.
