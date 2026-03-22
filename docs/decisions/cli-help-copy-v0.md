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

```text
Usage:
  patram <command> [options]
  patram help [command]

Patram explores docs and how they link to sources.

Commands:
  check    Validate a project, directory, or file
  query    Run a stored query or an ad hoc where clause
  queries  List stored queries
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

```text
Usage:
  patram query <name> [options]
  patram query --where "<clause>" [options]

Run a stored query or an ad hoc where clause against graph nodes.

Options:
  --where <clause>   Run an ad hoc query instead of a stored query
  --offset <number>  Skip the first N matches
  --limit <number>   Limit the number of matches
  --plain            Print plain text output
  --json             Print JSON output

Examples:
  patram query command-taxonomy
  patram query term-usage
  patram query --where "about_command:*"
  patram query pending --limit 10 --offset 20

Related:
  patram queries
  patram show

Help topics:
  patram help query-language
```

### `queries`

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

### `show`

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

```text
Query language filters graph nodes with field and relation terms.

Usage:
  <field>=<value>
  <field>^=<prefix>
  <field>~<text>
  <relation>:*
  <relation>=<target-id>
  not <term>
  <term> and <term>

Fields:
  id
  kind
  status
  path
  title

Relations:
  <relation>:*           Match nodes with at least one outgoing relation
  <relation>=<target-id> Match nodes linked to an exact target id

Operators:
  =    Exact match
  ^=   Prefix match
  ~    Contains text
  not  Negation
  and  Combine terms

Examples:
  kind=decision and status=accepted
  path^=docs/reference/commands/
  title~query
  about_command:*
  implements_command=command:query
  not uses_term=term:graph
```

## Error Output

### Unknown command without close match

```text
Unknown command: frob

Commands:
  check
  query
  queries
  show

Next:
  patram --help
```

### Unknown command with close match

```text
Unknown command: qurey

Did you mean:
  query

Next:
  patram help query
```

### Unknown option

```text
Unknown option: --wat

Usage:
  patram query <name> [options]
  patram query --where "<clause>" [options]

Next:
  patram help query
```

### Unknown option with close match

```text
Unknown option: --ofset

Did you mean:
  --offset

Next:
  patram help query
```

### Option not valid for command

```text
Option not valid for command: --where

Usage:
  patram check [path] [options]

Next:
  patram help check
```

### Missing required argument for `show`

```text
Missing required argument: <file>

Usage:
  patram show <file>

Examples:
  patram show docs/patram.md
  patram show lib/patram-cli.js
```

### Missing required argument for `query`

```text
Missing required argument: <name> or --where "<clause>"

Usage:
  patram query <name> [options]
  patram query --where "<clause>" [options]

Examples:
  patram query command-taxonomy
  patram query --where "about_command:*"
```

### Invalid `--where`

```text
Invalid where clause:
  <query>:1:1 error query.invalid Unsupported query token "kind:decision".

Next:
  patram help query-language
```

### Unknown help target without close match

```text
Unknown help topic or command: frob

Help topics:
  query-language

Commands:
  check
  query
  queries
  show

Next:
  patram help query
```

### Unknown help target with command match

```text
Unknown help topic or command: qurey

Did you mean:
  query

Next:
  patram help query
```

### Unknown help target with topic match

```text
Unknown help topic or command: query-lang

Did you mean:
  query-language

Next:
  patram help query-language
```
