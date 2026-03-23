# Query

- Command: query
- Command Summary: Run a stored query or an ad hoc where clause against graph
  nodes.

`patram query <name>` runs a stored query, and `patram query --where "<clause>"`
evaluates one ad hoc filter.

Supported where-clause forms:

- Exact field matches: `id=<value>`, `kind=<value>`, `path=<value>`,
  `status=<value>`
- Prefix matches: `id^=<prefix>`, `path^=<prefix>`
- Title contains matches: `title~<text>`
- Set membership: `<field> in [<value>, ...]`, `<field> not in [<value>, ...]`
- Relation tests: `<relation>:*`, `<relation>=<target-id>`
- Traversal terms inside aggregates: `in:<relation>`, `out:<relation>`
- Aggregate predicates: `any(<traversal>, <term> and <term>)`,
  `none(<traversal>, <term> and <term>)`
- Aggregate counts:
  `count(<traversal>, <term> and <term>) <comparison> <number>`
- Clause composition: `not <term>`, `<term> and <term>`

Supported fields by operator:

- Exact match: `id`, `kind`, `path`, `status`
- Prefix match: `id`, `path`
- Contains text: `title`
- Set membership: `id`, `kind`, `path`, `status`, `title`

Examples:

- `patram query --where "id=command:query"`
- `patram query --where "about_command:*"`
- `patram query --where "implements_command=command:query"`
- `patram query --where "status not in [done, dropped, superseded]"`
- `patram query --where "any(out:tracked_in, kind=plan and status=active)"`
- `patram query --where "kind=plan and none(in:tracked_in, kind=task and status not in [done, dropped, superseded])"`
- `patram query --where "count(in:decided_by, kind=task) = 0"`
