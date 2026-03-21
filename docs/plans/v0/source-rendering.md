# Source Rendering Plan

- Kind: plan
- Status: active
- Tracked in: docs/roadmap/v0-dogfood.md
- Decided by: docs/decisions/source-rendering.md
- Decided by: docs/decisions/show-output.md
- Decided by: docs/decisions/cli-output-architecture.md
- Decided by: docs/decisions/cli-formatting-libraries.md

## Goal

- Add custom rich source rendering for `patram show`.
- Keep `plain` and `json` output stable while improving TTY rendering.
- Support both markdown documents and direct source-file highlighting.

## Scope

- Add source classification for markdown and non-markdown files.
- Add a custom markdown-to-ANSI renderer based on `md4x` AST output.
- Add Shiki-based syntax highlighting for markdown fenced blocks.
- Add Shiki-based syntax highlighting for non-markdown source files.
- Keep resolved-link summaries after the formatted source block in `show`.

## Order

1. Document the rendering decision and source-rendering conventions.
2. Add failing tests for markdown rich rendering, divider handling, fenced code
   block rendering, and non-markdown source highlighting.
3. Add a renderer boundary that receives source text plus file path and returns
   rich source output.
4. Implement custom markdown rendering from `md4x.parseAST(...)`.
5. Implement Shiki-backed fenced code block rendering and direct source-file
   highlighting.
6. Integrate the renderer into `show` rich output without changing `plain` and
   `json`.
7. Refactor shared writer and highlighting helpers if needed.
8. Run validation.

## Acceptance

- `patram show docs/patram.md` renders markdown structure in `rich` mode.
- `patram show docs/patram.md --plain` keeps the current plain-text source
  output.
- `patram show <source-file>.js` applies syntax highlighting in `rich` mode.
- Markdown fenced code blocks use Shiki highlighting when the language is
  supported.
- Resolved-link summaries still render after the source section.
- `npm run all` passes.
