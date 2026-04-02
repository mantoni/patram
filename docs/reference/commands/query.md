# Query

- Command: query
- Command Summary: Run a stored query or an ad hoc Cypher query against graph
  nodes.

`patram query <name>` runs a stored query, and `patram query --cypher '<query>'`
evaluates one ad hoc Cypher query.

Use `--explain` to inspect the resolved query and parsed expression tree without
rendering result rows. Use `--lint` to validate syntax and semantic query
references, including nested traversal clauses, without executing the query.

Agents should usually start with `patram queries`, then run a named query, then
use `patram show <path>` on the matching document or source file.

Supported Cypher subset:

- `MATCH (n)` or `MATCH (n:Label)`
- `WHERE` predicates over node properties such as `n.status = 'active'`
- `STARTS WITH`, `CONTAINS`, `IN`, and `NOT IN`
- `EXISTS { MATCH ... }` relation subqueries
- `COUNT { MATCH ... } <comparison> <number>` relation-count subqueries
- `RETURN n`

Patram property aliases:

- `n.id` -> semantic node id
- `n.class` -> Patram `$class`
- `n.path` -> Patram `$path`
- `n.filename` -> derived filename
- `n.title`, `n.status`, `n.kind` -> normal Patram fields

Exact semantic ids:

- Unclassified documents use `doc:<repo-relative-path>`.
- Document-backed entities promoted through structural `$class` and `$id`
  mappings use semantic ids such as `contract:release-flow`.
- Commands use `command:<name>`.
- Terms use `term:<name>`.

Examples:

- `patram query active-plans`
- `patram query --cypher "MATCH (n:Command) RETURN n"`
- `patram query --cypher "MATCH (n) WHERE n.id = 'command:query' RETURN n"`
- `patram query --cypher "MATCH (n) WHERE EXISTS { MATCH (n)-[:IMPLEMENTS_COMMAND]->(command:Command) WHERE command.id = 'command:query' } RETURN n"`
- `patram query --cypher "MATCH (n) WHERE EXISTS { MATCH (n)-[:USES_TERM]->(term:Term) WHERE term.id = 'term:graph' } RETURN n"`
- `patram query --cypher "MATCH (n:Decision) WHERE n.status = 'accepted' AND COUNT { MATCH (task:Task)-[:DECIDED_BY]->(n) } = 0 RETURN n"`
- `patram query ready-tasks --explain`
- `patram query --cypher "MATCH (n:Decision) WHERE n.status = 'accepted' AND COUNT { MATCH (task:Task)-[:DECIDED_BY]->(n) } = 0 RETURN n" --lint`

Package query APIs also support explicit `@binding_name` placeholders in value
positions through `parseWhereClause(where_clause, { bindings })` and
`queryGraph(..., { bindings })`. The CLI only accepts Cypher.
