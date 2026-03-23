# Query

- Command: query
- Command Summary: Run a stored query or an ad hoc where clause against graph
  nodes.

`patram query <name>` runs a stored query, and `patram query --where "<clause>"`
evaluates one ad hoc filter.

The where language supports exact matches, prefix matches, relation tests,
relation-scoped traversal through `in:<relation>` and `out:<relation>`,
aggregate predicates `any(...)`, `none(...)`, and `count(...)`, plus set
membership terms such as `status not in [done, dropped, superseded]`.

Examples:

- `patram query --where "id=command:query"`
- `patram query --where "implements_command=command:query"`
- `patram query --where "uses_term=term:graph"`
- `patram query --where "kind=plan and none(in:tracked_in, kind=task and status not in [done, dropped, superseded])"`
- `patram query --where "count(in:decided_by, kind=task) = 0"`
