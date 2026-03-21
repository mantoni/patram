# Source Rendering Terminal Surfaces Plan

- Kind: plan
- Status: active
- Tracked in: docs/roadmap/v0-dogfood.md
- Decided by: docs/decisions/source-rendering-terminal-surfaces.md
- Decided by: docs/decisions/source-rendering.md
- Decided by: docs/decisions/rich-output-colors.md

## Goal

- Align rich-source quote and code surfaces with the active terminal palette.
- Make quote and code blocks render as consistent padded boxes.
- Improve inline-code legibility without changing plain or json output.
- Keep wrapped list-item continuation lines aligned inside their list items.

## Scope

- Replace Patram-owned rich-source hex surface colors with standard ANSI named
  colors.
- Keep Shiki token colors for syntax-highlighted code content.
- Pad blockquote rows to a shared visible width with one trailing surface cell.
- Give blockquotes a stronger surface than fenced code blocks.
- Pad fenced and direct-source code-block rows to a shared visible width.
- Remove visible code-block side-border glyphs in color mode.
- Keep code-block labels aligned to the right edge of the padded box.
- Darken inline-code surface styling relative to plain paragraph text while
  keeping the foreground terminal-native and dimmed.
- Keep code and inline-code surfaces on a visible terminal gray instead of
  terminal black.
- Use a darker gray for code surfaces than for blockquotes.
- Add hanging-indent wrapping for list-item continuation lines.
- Add one bottom spacer row for fenced markdown code blocks.
- Indent fenced markdown code content by one extra leading cell.

## Order

1. Update source-rendering conventions and record the terminal-surface decision.
2. Add failing renderer tests for list wrapping, quote surface styling,
   code-block surface styling, and inline-code styling.
3. Replace renderer-owned surface colors with the corrected terminal palette
   mapping.
4. Add visible-width padding helpers for quote and code-block rows.
5. Add hanging-indent wrapping for list items.
6. Run validation and commit the fixup.

## Acceptance

- Rich blockquotes use terminal palette styling and pad to a shared box width.
- Rich fenced code blocks use one uniform surface color across each full row
  without visible side-border glyphs.
- Inline code uses a darker terminal surface plus dimmed terminal-native text.
- Rich fenced markdown code blocks include one shaded spacer row below content.
- Rich fenced markdown code lines start one cell deeper than direct source-file
  code blocks.
- Wrapped list items keep continuation lines inside the list indentation.
- `npx vitest run lib/render-rich-source.test.js` passes.
- `npm run all` passes.
