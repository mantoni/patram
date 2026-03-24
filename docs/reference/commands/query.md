# Query

- Command: query
- Command Summary: Run a stored query or an ad hoc where clause against graph
  nodes.

`patram query <name>` runs a stored query, and `patram query --where "<clause>"`
evaluates one ad hoc filter.

Use `--explain` to inspect the resolved query and parsed clause tree without
rendering result rows. Use `--lint` to validate syntax and semantic query
references, including nested traversal clauses, without executing the query.

Agents should usually start with `patram queries`, then run a named query, then
use `patram show <path>` on the matching document or source file.

Supported where-clause forms:

- Exact field matches: `$id=<value>`, `$class=<value>`, `$path=<value>`,
  `status=<value>`
- Prefix matches: `$id^=<prefix>`, `$path^=<prefix>`
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

- Exact match: `$id`, `$class`, `$path`, `status`
- Prefix match: `$id`, `$path`
- Contains text: `title`
- Set membership: `$id`, `$class`, `$path`, `status`, `title`

Exact relation-target ids:

- Documents use `doc:<repo-relative-path>`.
- Commands use `command:<name>`.
- Terms use `term:<name>`.

Examples:

- `patram query active-plans`
- `patram query --where "tracked_in=doc:docs/plans/v0/worktracking-agent-guidance.md"`
- `patram query --where "$id=command:query"`
- `patram query --where "implements_command=command:query"`
- `patram query --where "uses_term=term:graph"`
- `patram query --where "status not in [done, dropped, superseded]"`
- `patram query --where "$class=plan and none(in:tracked_in, $class=decision)"`
- `patram query --where "count(in:decided_by, $class=task) = 0"`
- `patram query ready-tasks --explain`
- `patram query --where "$class=decision and status=accepted and count(in:decided_by, $class=task) = 0" --lint`
