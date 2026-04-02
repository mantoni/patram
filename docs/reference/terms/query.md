# Query

- term: query
- definition: A graph query that selects Patram nodes by fields, labels, and
  relation patterns.

Stored queries live in `.patram.json`, and ad hoc queries are passed on the CLI.
Patram uses Cypher for CLI queries and stored-query config. Package consumers
can bind explicit `@binding_name` value placeholders through
`parseQueryExpression(..., { bindings })` and `queryGraph(..., { bindings })`.
