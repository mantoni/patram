# Query

- Term: query
- Term Definition: A where-clause filter that selects graph nodes by fields and
  relation existence.

Stored queries live in `.patram.json`, and ad hoc queries are passed on the CLI.
Package consumers can also evaluate parameterized queries with explicit
`@binding_name` value placeholders through `parseWhereClause` and `queryGraph`
bindings.
