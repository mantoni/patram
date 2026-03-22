# Query

- Command: query
- Command Summary: Run a stored query or an ad hoc where clause against graph
  nodes.

`patram query <name>` runs a stored query, and `patram query --where "<clause>"`
evaluates one ad hoc filter.

Examples:

- `patram query --where "id=command:query"`
- `patram query --where "implements_command=command:query"`
- `patram query --where "uses_term=term:graph"`
