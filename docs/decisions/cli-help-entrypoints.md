# CLI Help Entrypoints Proposal

- Kind: decision
- Status: accepted
- Tracked in: docs/plans/v0/cli-help-and-errors.md

- `patram`, `patram --help`, and `patram help` print the same root help.
- `patram help <command>` and `patram <command> --help` print the same command
  help.
- `patram help <topic>` prints one help topic.
- Start v0 help topics with `query-language`.
- Successful help output goes to `stdout` and exits `0`.
- Parse and usage failures go to `stderr` and exit `1`.
- Root help stays short and acts as an index.
- Command help includes usage, summary, relevant output-shape options, examples,
  related commands, and optional help topics.
- Show `--plain` and `--json` in command help where the command supports them.
- Show `--help`, `--plain`, `--json`, `--color`, and `--no-color` in root help.
- Keep `--color` and `--no-color` out of per-command help.
- Resolve `patram help <name>` against exact command names and exact help topics
  before attempting suggestions.
- Unknown commands, unknown options, unknown help targets, extra positional
  arguments, and unknown stored query names report the invalid token plus one
  recovery step.
- Missing required arguments report command-specific usage and examples.
- Invalid `--where` diagnostics keep the query parser diagnostic and hint
  `patram help query-language`.

## Help Surface

```json
{
  "root_entrypoints": ["patram", "patram --help", "patram help"],
  "command_entrypoints": [
    "patram help check",
    "patram help query",
    "patram help queries",
    "patram help show",
    "patram <command> --help"
  ],
  "help_topics": ["query-language"],
  "exit_codes": {
    "help": 0,
    "success": 0,
    "parse_or_usage_error": 1
  }
}
```

## Command Help Content

```json
{
  "root_help": [
    "usage",
    "product summary",
    "commands",
    "global options",
    "next"
  ],
  "command_help": [
    "usage",
    "summary",
    "options",
    "examples",
    "related",
    "help_topics?"
  ]
}
```

## Error Recovery

```json
{
  "unknown_command": "invalid token + suggestions or command list + next step",
  "unknown_option": "invalid token + optional suggestion + command help next step",
  "wrong_command_option": "invalid token + command usage + command help next step",
  "unexpected_argument": "invalid positional token + command usage + next step",
  "missing_required_argument": "missing argument + usage + examples",
  "invalid_where_clause": "query parser diagnostic + help topic next step",
  "unknown_stored_query": "invalid query name + optional suggestion + next step",
  "unknown_help_target": "invalid token + suggestions or available names + help next step"
}
```

## Rationale

- One root index keeps the top-level help stable as the command surface grows.
- Keeping command help short makes `--help` useful at the prompt instead of
  turning it into a manual page.
- Treating `query-language` as a help topic keeps richer syntax documentation
  available in-app without bloating `query --help`.
- Repeating `--plain` and `--json` in command help makes output-shape support
  explicit for each command.
- Leaving color flags in root help keeps per-command help focused on task-level
  behavior instead of terminal presentation details.
