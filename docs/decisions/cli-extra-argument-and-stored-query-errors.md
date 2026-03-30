# CLI Extra Argument And Stored Query Errors

- Kind: decision
- Status: accepted
- Tracked in: docs/plans/v0/cli-extra-argument-and-stored-query-errors.md
- Decided by: docs/decisions/cli-help-entrypoints.md
- Decided by: docs/decisions/cli-help-copy-v0.md

- Render extra positional argument failures as structured
  `Unexpected argument: <token>` diagnostics instead of raw sentence-only
  messages.
- Use the first unexpected positional token as `<token>`.
- Follow extra positional diagnostics with command-specific `Usage:` and `Next:`
  sections.
- For command entrypoints, point `Next:` to `patram help <command>`.
- For `patram help <target> <extra>`, point `Next:` to `patram --help`.
- Render unknown stored query names as `Unknown stored query: <name>`.
- When a close stored query match exists, add `Did you mean:` and point `Next:`
  to `patram query <suggestion>`.
- When no close stored query match exists, omit query listings and point `Next:`
  to `patram queries`.
- Apply the same extra positional style to `help`, `fields`, `check`, `query`,
  `queries`, `refs`, and `show`.

## Rationale

- The accepted CLI help contract already treats invalid tokens as recovery
  prompts rather than low-context parse failures.
- Extra positional arguments currently fall back to command-local prose, which
  makes otherwise similar errors look unrelated across commands.
- Stored queries act as named CLI entrypoints in this repo, so missing names
  benefit from the same suggestion-oriented copy as other unknown tokens.
- Using one shared shape keeps parser errors and runtime lookup errors easy to
  scan without inventing command-specific wording.
