# CLI Formatting Libraries Proposal

- kind: decision
- status: accepted
- tracked_in: docs/plans/v0/show-command.md

- Keep `ansis`, `string-width`, `wrap-ansi`, and `slice-ansi` as the v0 CLI
  formatting stack.
- Use `ansis` for `rich`-mode color and text styling only.
- Use `string-width` for width measurement and alignment decisions.
- Use `wrap-ansi` and `slice-ansi` when wrapping or truncating styled text.
- Keep layout rules and output view-model logic in repo code.
- Move any runtime-used formatting packages from `devDependencies` to
  `dependencies` when the renderer lands.

## Stack

```json
{
  "style": "ansis",
  "measure": "string-width",
  "wrap": "wrap-ansi",
  "slice": "slice-ansi"
}
```

## Rationale

- The required building blocks are already in the repo, so v0 does not need a
  new formatting dependency decision.
- These libraries match the accepted `plain` and `rich` sibling-renderer model
  without introducing a terminal UI framework.
- Visible-width measurement and ANSI-safe wrapping are the hard parts to get
  right in terminal output, and the current stack addresses those directly.
- Keeping layout decisions local avoids coupling command semantics to a
  third-party presentation framework.
