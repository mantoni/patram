# Source Rendering Proposal

- Kind: decision
- Status: accepted
- Tracked in: docs/plans/v0/source-rendering.md

- Parse markdown source with `md4x`.
- Render terminal markdown with Patram-owned renderer code.
- Do not use `md4x` ANSI output as the user-facing `show` renderer.
- Keep `plain` output canonical and unformatted.
- Apply source formatting only in `rich` output.
- Allow the `show` rich source block to diverge from the canonical plain source
  text when rendering markdown structure and highlighted source code.
- Render markdown files from their original `source`, not from Patram's
  link-rewritten `rendered_source`.
- Keep Patram's resolved-link summaries as a renderer-owned second section after
  the formatted source block.
- Apply Shiki syntax highlighting to fenced code blocks inside markdown files.
- Apply Shiki syntax highlighting to non-markdown source files shown by path.
- Fall back to unhighlighted source text when no language can be resolved.

## Rationale

- Patram needs control over spacing, dividers, indentation, tables, and code
  block framing, so markdown parsing and terminal rendering must stay separate.
- `md4x` provides a fast parser and AST without forcing Patram into its ANSI
  layout decisions.
- Rendering from the original markdown source preserves markdown semantics for
  links, tables, and fenced blocks while keeping Patram's resolved-link
  footnotes independent.
- Shiki gives Patram one highlighting engine for markdown fenced code blocks and
  direct source-file display, which keeps the terminal rendering stack
  consistent.
