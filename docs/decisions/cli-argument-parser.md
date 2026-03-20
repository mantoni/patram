# CLI Argument Parser Proposal

- Kind: decision
- Status: accepted
- Tracked in: docs/plans/v0/show-command.md

- Use `node:util` `parseArgs` for v0 CLI parsing.
- Add one repo-local parser layer that declares commands, positionals, and
  shared output flags.
- Parse `--plain`, `--json`, `--color`, and `--no-color` before command
  execution.
- Keep help text, unknown-option errors, and positional validation in repo code.
- Do not add Commander, Yargs, CAC, or Sade in v0.

## Command Shape

```json
{
  "global_options": ["plain", "json", "color", "no-color"],
  "commands": {
    "check": { "positionals": ["path?"] },
    "query": { "positionals": ["query_or_where?"], "options": ["where"] },
    "queries": { "positionals": [] },
    "show": { "positionals": ["file"] }
  }
}
```

## Rationale

- Node `22` is already required, so the built-in parser is available without a
  new runtime dependency.
- The v0 command surface is small enough that a thin local layer stays simpler
  than adopting a framework-oriented CLI library.
- One declarative parser layer makes output-mode handling consistent across
  `check`, `query`, `queries`, and `show`.
- Keeping validation local preserves control over low-noise CLI errors and test
  fixtures.
