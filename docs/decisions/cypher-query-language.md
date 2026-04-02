# Cypher Query Language Proposal

- kind: decision
- status: accepted
- tracked_in: docs/plans/v0/cypher-query-language.md

- Adopt Cypher as Patram's primary query syntax for ad hoc queries and stored
  queries.
- Keep Patram's current in-memory graph materialization and CLI result model.
- Limit the first Cypher pass to read-only graph selection rooted at one return
  variable.
- Use `@neo4j-cypher/language-support` for Cypher syntax validation and editor
  support.
- Translate the supported Cypher subset into Patram's existing graph-filter
  execution model for the first pass.
- Keep the legacy `where` query language temporarily as a compatibility path
  while the repo migrates its stored queries and tests.

## Supported Cypher Shape

- One statement per query.
- `MATCH (<variable>)` with an optional node label.
- Optional `WHERE` boolean expression.
- `RETURN <variable>` as the only return shape.
- Property predicates over Patram node fields.
- `EXISTS { MATCH ... WHERE ... }` subqueries for relation existence checks.
- `COUNT { MATCH ... WHERE ... } <comparison> <integer>` subqueries for related
  node counts.

## Patram Graph Mapping

- Patram graph nodes behave like Cypher nodes.
- Patram classes map to Cypher labels.
- Patram relation names map to Cypher relationship types by uppercasing the
  relation name.
- Structural fields are queried through property aliases:
  - `id` -> `$id`
  - `class` -> `$class`
  - `path` -> `$path`
  - `filename` -> derived filename
- Non-structural metadata fields keep their existing names.

## First-Pass Limits

- No write clauses.
- No projections other than `RETURN <variable>`.
- No `WITH`, `UNWIND`, `OPTIONAL MATCH`, `CALL`, or path binding.
- No arbitrary relationship-length patterns.
- No ordering or pagination inside Cypher text.
- No multi-node root result sets.

## Rationale

- Cypher is a more familiar graph query language than Patram's bespoke
  where-clause syntax.
- Patram already has a stable graph materialization pipeline and CLI output, so
  replacing the execution backend entirely is unnecessary for the first pass.
- The Neo4j language-support package is strong on parsing, diagnostics, and
  completion, but it is not itself a query runtime.
- Translating a constrained Cypher subset lets Patram ship better query syntax
  without coupling the project to a Neo4j server or rewriting graph execution in
  one step.
