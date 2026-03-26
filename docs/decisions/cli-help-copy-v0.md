# CLI Help Copy v0 Proposal

- Kind: decision
- Status: accepted
- Tracked in: docs/plans/v0/cli-help-and-errors.md
- Decided by: docs/decisions/cli-help-entrypoints.md

- Freeze the v0 root help, command help, help-topic help, and key error outputs
  as canonical plain-text fixtures.
- Keep `patram help <command>` and `patram <command> --help` byte-for-byte
  identical.
- Keep `patram`, `patram --help`, and `patram help` byte-for-byte identical.

## Root Help

[patram fixture=root-help role=output]: #

```text
Usage:
  patram <command> [options]
  patram help [command]

Patram explores docs and how they link to sources.

Commands:
  check    Validate a project, directory, or file
  fields   Discover likely field schema from source claims
  query    Run a stored query or an ad hoc where clause
  queries  List stored queries
  refs     Inspect incoming graph references for one file
  show     Print a file with resolved links

Global options:
  --help
  --plain
  --json
  --color <auto|always|never>
  --no-color

Next:
  patram help <command>
```

## Command Help

### `check`

[patram fixture=command-help-check role=output]: #

```text
Usage:
  patram check [path] [options]

Validate a project, directory, or file and report graph diagnostics.

Options:
  --plain   Print plain text output
  --json    Print JSON output

Examples:
  patram check
  patram check docs
  patram check docs/patram.md

Related:
  patram show
  patram query
```

### `query`

[patram fixture=command-help-query role=output]: #

```text
Usage:
  patram query <name> [options]
  patram query --where "<clause>" [options]

Run a stored query or an ad hoc where clause against graph nodes.

Where clause:
  $id=<value> | $class=<value> | $path=<value> | status=<value>
  $id^=<prefix> | $path^=<prefix> | title~<text>
  <field> in [<value>, ...] | <field> not in [<value>, ...]
  <relation>:* | <relation>=<target-id>
  any(<traversal>, <term> and <term>)
  none(<traversal>, <term> and <term>)
  count(<traversal>, <term> and <term>) <comparison> <number>

Options:
  --where <clause>   Run an ad hoc query instead of a stored query
  --offset <number>  Skip the first N matches
  --limit <number>   Limit the number of matches
  --explain          Explain the resolved query without rendering results
  --lint             Validate syntax and relation references only
  --plain            Print plain text output
  --json             Print JSON output

Examples:
  patram query active-plans
  patram query --where "tracked_in=doc:docs/plans/v0/worktracking-agent-guidance.md"
  patram query --where "status not in [done, dropped, superseded]"
  patram query --where "$class=plan and none(in:tracked_in, $class=decision)"
  patram query --where "count(in:decided_by, $class=task) = 0"
  patram query ready-tasks --explain
  patram query --where "$class=decision and status=accepted and count(in:decided_by, $class=task) = 0" --lint
  patram query active-plans --limit 10 --offset 20

Related:
  patram queries
  patram show

Help topics:
  patram help query-language
```

### `queries`

[patram fixture=command-help-queries role=output]: #

```text
Usage:
  patram queries [options]

List the stored queries defined in the project configuration.

Options:
  --plain   Print plain text output
  --json    Print JSON output

Examples:
  patram queries

Related:
  patram query
```

### `refs`

[patram fixture=command-help-refs role=output]: #

```text
Usage:
  patram refs <file> [options]

Inspect incoming graph references for one file, grouped by relation.

Options:
  --where <clause>   Filter incoming source nodes with a where clause
  --plain            Print plain text output
  --json             Print JSON output

Examples:
  patram refs docs/decisions/query-language.md
  patram refs docs/decisions/query-language.md --where "$class=document"
  patram refs docs/decisions/query-language.md --json

Related:
  patram show
  patram query

Help topics:
  patram help query-language
```

### `show`

[patram fixture=command-help-show role=output]: #

```text
Usage:
  patram show <file> [options]

Print one source file with indexed links resolved against the graph.

Options:
  --plain   Print plain text output
  --json    Print JSON output

Examples:
  patram show docs/patram.md
  patram show lib/patram-cli.js

Related:
  patram query
  patram check
```

## Help Topic

### `query-language`

[patram fixture=help-topic-query-language role=output]: #

```text
Query language filters graph nodes with field, relation, traversal, and aggregate terms.

Usage:
  <field>=<value>
  $id^=<prefix>
  $path^=<prefix>
  title~<text>
  <field> in [<value>, ...]
  <field> not in [<value>, ...]
  <relation>:*
  <relation>=<target-id>
  any(<traversal>, <term> and <term>)
  none(<traversal>, <term> and <term>)
  count(<traversal>, <term> and <term>) <comparison> <number>
  not <term>
  <term> and <term>
  <term> or <term>
  (<expression>)

Fields:
  Exact match: $id, $class, $path, status
  Prefix match: $id, $path
  Contains text: title
  Set membership: $id, $class, $path, status, title

Relations:
  <relation>:*            Match nodes with at least one outgoing relation
  <relation>=<target-id>  Match nodes linked to an exact target id
  in:<relation>           Traverse one incoming relation hop
  out:<relation>          Traverse one outgoing relation hop

Operators:
  =             Exact field match or exact count comparison
  ^=            Prefix match for structural id and path
  ~             Contains text for title
  in            Set membership for supported fields
  not in        Set exclusion for supported fields
  not           Negate one term
  and           Combine terms
  or            Match either side
  ( )           Group boolean expressions
  != < > >= <=  Count comparisons

Examples:
  $class=decision and status=accepted
  $class=task or status=done
  ($class=task or status=blocked) and title~Show
  $path^=docs/plans/
  title~query
  tracked_in=doc:docs/plans/v0/worktracking-agent-guidance.md
  implements_command=command:query
  status not in [done, dropped, superseded]
  any(in:tracked_in, $class=task and status in [pending, ready, in_progress, blocked])
  none(in:tracked_in, $class=decision)
  count(in:decided_by, $class=task) = 0
  not uses_term=term:graph
```

## Error Output

### Unknown command without close match

[patram fixture=error-unknown-command role=output]: #

```text
Unknown command: frob

Commands:
  check
  fields
  query
  queries
  refs
  show

Next:
  patram --help
```

### Unknown command with close match

[patram fixture=error-unknown-command-suggestion role=output]: #

```text
Unknown command: qurey

Did you mean:
  query

Next:
  patram help query
```

### Unknown option

[patram fixture=error-unknown-option role=output]: #

```text
Unknown option: --wat

Usage:
  patram query <name> [options]
  patram query --where "<clause>" [options]

Next:
  patram help query
```

### Unknown option with close match

[patram fixture=error-unknown-option-suggestion role=output]: #

```text
Unknown option: --ofset

Did you mean:
  --offset

Next:
  patram help query
```

### Option not valid for command

[patram fixture=error-invalid-command-option role=output]: #

```text
Option not valid for command: --where

Usage:
  patram check [path] [options]

Next:
  patram help check
```

### Missing required argument for `show`

[patram fixture=error-missing-show-argument role=output]: #

```text
Missing required argument: <file>

Usage:
  patram show <file>

Examples:
  patram show docs/patram.md
  patram show lib/patram-cli.js
```

### Missing required argument for `query`

[patram fixture=error-missing-query-argument role=output]: #

```text
Missing required argument: <name> or --where "<clause>"

Usage:
  patram query <name> [options]
  patram query --where "<clause>" [options]

Examples:
  patram query active-plans
  patram query --where "tracked_in=doc:docs/plans/v0/worktracking-agent-guidance.md"
```

### Invalid `--where`

[patram fixture=error-invalid-where role=output]: #

```text
Invalid where clause:
  <query>:1:1 error query.invalid Unsupported query token "kind:decision".

Next:
  patram help query-language
```

### Unknown help target without close match

[patram fixture=error-unknown-help-target role=output]: #

```text
Unknown help topic or command: frob

Help topics:
  query-language

Commands:
  check
  fields
  query
  queries
  refs
  show

Next:
  patram help query
```

### Unknown help target with command match

[patram fixture=error-unknown-help-target-command-suggestion role=output]: #

```text
Unknown help topic or command: qurey

Did you mean:
  query

Next:
  patram help query
```

### Unknown help target with topic match

[patram fixture=error-unknown-help-target-topic-suggestion role=output]: #

```text
Unknown help topic or command: query-lang

Did you mean:
  query-language

Next:
  patram help query-language
```
