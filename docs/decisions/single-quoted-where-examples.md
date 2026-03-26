# Single-Quoted Where Examples

- Kind: decision
- Status: accepted
- Tracked in: docs/plans/v0/single-quoted-where-examples.md

- Use single quotes for shell-facing `--where` command examples in help output,
  hints, and current reference docs.
- Apply the same quoting in usage and missing-argument copy when the text shows
  a full command invocation with a placeholder clause.
- Keep option labels such as `--where <clause>` unchanged because they describe
  the flag shape rather than a shell command.

## Rationale

- Query clauses often include structural fields such as `$id`, `$class`, and
  `$path`.
- Double-quoted shell examples expand those names in common shells when users
  copy them verbatim.
- Single quotes keep the examples copy-paste safe in POSIX shells and remain
  acceptable in PowerShell.

## Example

```bash
patram query --where '$class=plan and none(in:tracked_in, $class=decision)'
patram refs docs/decisions/query-language.md --where '$class=document'
```
