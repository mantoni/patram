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
  query    Run a stored query or an ad hoc Cypher query
  queries  List and manage stored queries
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
  patram check [path ...] [options]

Validate a project, directory, or file and report graph diagnostics.

Options:
  --plain   Print plain text output
  --json    Print JSON output

Examples:
  patram check
  patram check docs
  patram check docs/patram.md
  patram check docs docs/patram.md

Related:
  patram show
  patram query
```

### `query`

[patram fixture=command-help-query role=output]: #

```text
Usage:
  patram query <name> [options]
  patram query --cypher '<query>' [options]

Run a stored query or an ad hoc Cypher query against graph nodes.

Query syntax:
  MATCH (n) RETURN n
  MATCH (n:Label) WHERE n.status = 'active' RETURN n
  MATCH (n) WHERE n.id = 'doc:path/to/file.md' RETURN n
  MATCH (n) WHERE EXISTS { MATCH ... } RETURN n
  MATCH (n) WHERE COUNT { MATCH ... } = 0 RETURN n

Options:
  --cypher <query>   Run an ad hoc Cypher query instead of a stored query
  --offset <number>  Skip the first N matches
  --limit <number>   Limit the number of matches
  --explain          Explain the resolved query without rendering results
  --lint             Validate syntax and relation references only
  --plain            Print plain text output
  --json             Print JSON output

Examples:
  patram query active-plans
  patram query --cypher "MATCH (n:Plan) WHERE n.status = 'active' RETURN n"
  patram query --cypher "MATCH (n) WHERE n.id = 'doc:docs/plans/v0/worktracking-agent-guidance.md' RETURN n"
  patram query --cypher "MATCH (n) WHERE n.status NOT IN ['done', 'dropped', 'superseded'] RETURN n"
  patram query --cypher "MATCH (n:Plan) WHERE NOT EXISTS { MATCH (decision:Decision)-[:TRACKED_IN]->(n) } RETURN n"
  patram query --cypher "MATCH (n:Decision) WHERE COUNT { MATCH (task:Task)-[:DECIDED_BY]->(n) } = 0 RETURN n"
  patram query ready-tasks --explain
  patram query --cypher "MATCH (n:Decision) WHERE n.status = 'accepted' AND COUNT { MATCH (task:Task)-[:DECIDED_BY]->(n) } = 0 RETURN n" --lint
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
  patram queries add <name> --cypher <query> [--desc <text>] [options]
  patram queries update <name> [--name <new_name>] [--cypher <query>] [--desc <text>] [options]
  patram queries remove <name> [options]

List stored queries or mutate them through add, update, and remove.

Options:
  --cypher <query>   Persist a new stored Cypher query
  --name <new_name>  Set or rename the stored query name for update
  --desc <text>      Set or clear the stored query description
  --plain            Print plain text output
  --json             Print JSON output

Examples:
  patram queries
  patram queries add active-plans --cypher "MATCH (n:Plan) WHERE n.status = 'active' RETURN n"
  patram queries update ready-tasks --desc 'Show tasks that are ready.'
  patram queries update ready-tasks --cypher "MATCH (n:Task) WHERE n.status = 'ready' RETURN n"
  patram queries remove ready-tasks

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
  --cypher <query>   Filter incoming source nodes with a Cypher query
  --plain            Print plain text output
  --json             Print JSON output

Examples:
  patram refs docs/decisions/query-language.md
  patram refs docs/decisions/query-language.md --cypher "MATCH (n:Document) RETURN n"
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
  patram show lib/cli/main.js

Related:
  patram query
  patram check
```

## Help Topic

### `query-language`

[patram fixture=help-topic-query-language role=output]: #

```text
Query language uses a constrained Cypher subset for graph node selection.

Usage:
  MATCH (n) RETURN n
  MATCH (n:Label) WHERE <predicate> RETURN n
  MATCH (n) WHERE EXISTS { MATCH ... } RETURN n
  MATCH (n) WHERE COUNT { MATCH ... } <comparison> <number> RETURN n

Fields:
  Root match: MATCH (n) or MATCH (n:Label)
  Return shape: RETURN n
  Property aliases: n.id, n.class, n.path, n.filename
  Common fields: n.title, n.status, n.kind
  Subqueries: EXISTS { MATCH ... WHERE ... } and COUNT { MATCH ... WHERE ... }

Relations:
  (n)-[:RELATION]->(target)        Outgoing relation match
  (source)-[:RELATION]->(n)        Incoming relation match
  (n)-[:RELATION]->(target:Label)  Label-qualified related node pattern

Operators:
  = | <>                  Equality and exact value comparison
  STARTS WITH | CONTAINS  String prefix and contains checks
  IN | NOT IN             Set membership checks
  AND | OR | NOT          Boolean composition
  EXISTS { ... }          Relation existence subqueries
  COUNT { ... }           Related-node count comparisons

Examples:
  MATCH (n:Decision) WHERE n.status = 'accepted' RETURN n
  MATCH (n:Task) WHERE n.status IN ['pending', 'ready'] RETURN n
  MATCH (n) WHERE n.filename = 'README.md' RETURN n
  MATCH (n:Plan) WHERE NOT EXISTS { MATCH (decision:Decision)-[:TRACKED_IN]->(n) } RETURN n
  MATCH (n:Decision) WHERE COUNT { MATCH (task:Task)-[:DECIDED_BY]->(n) } = 0 RETURN n
  MATCH (n) WHERE EXISTS { MATCH (n)-[:IMPLEMENTS_COMMAND]->(command:Command) WHERE command.id = 'command:query' } RETURN n
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
  patram query --cypher '<query>' [options]

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
  patram check [path ...] [options]

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
  patram show lib/cli/main.js
```

### Missing required argument for `query`

[patram fixture=error-missing-query-argument role=output]: #

```text
Missing required argument: <name> or --cypher '<query>'

Usage:
  patram query <name> [options]
  patram query --cypher '<query>' [options]

Examples:
  patram query active-plans
  patram query --cypher "MATCH (n:Plan) WHERE n.status = 'active' RETURN n"
```

### Unexpected argument for `help`

[patram fixture=error-unexpected-help-argument role=output]: #

```text
Unexpected argument: extra

Usage:
  patram help [command]

Next:
  patram --help
```

### Unexpected argument for `fields`

[patram fixture=error-unexpected-fields-argument role=output]: #

```text
Unexpected argument: x

Usage:
  patram fields [options]

Next:
  patram help fields
```

### Unexpected argument for `query`

[patram fixture=error-unexpected-query-argument role=output]: #

```text
Unexpected argument: extra

Usage:
  patram query <name> [options]
  patram query --cypher '<query>' [options]

Next:
  patram help query
```

### Unexpected argument for `queries`

[patram fixture=error-unexpected-queries-argument role=output]: #

```text
Unexpected argument: x

Usage:
  patram queries [options]
  patram queries add <name> --cypher <query> [--desc <text>] [options]
  patram queries update <name> [--name <new_name>] [--cypher <query>] [--desc <text>] [options]
  patram queries remove <name> [options]

Next:
  patram help queries
```

### Unexpected argument for `refs`

[patram fixture=error-unexpected-refs-argument role=output]: #

```text
Unexpected argument: extra

Usage:
  patram refs <file> [options]

Next:
  patram help refs
```

### Unexpected argument for `show`

[patram fixture=error-unexpected-show-argument role=output]: #

```text
Unexpected argument: extra

Usage:
  patram show <file> [options]

Next:
  patram help show
```

### Unknown stored query without close match

[patram fixture=error-unknown-stored-query role=output]: #

```text
Unknown stored query: unknown

Next:
  patram queries
```

### Unknown stored query with close match

[patram fixture=error-unknown-stored-query-suggestion role=output]: #

```text
Unknown stored query: active-plan

Did you mean:
  active-plans

Next:
  patram query active-plans
```

### Invalid `--where`

[patram fixture=error-invalid-where role=output]: #

```text
Invalid query:
  <query>:1:22 error query.invalid Label or relationship type decision is not present in the database. Make sure you didn't misspell it or that it is available when you run this statement in your application

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
