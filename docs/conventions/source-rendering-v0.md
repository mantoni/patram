# Source Rendering v0 Proposal

- Kind: convention
- Status: active

- Applies to `patram show` rich output only.
- Keeps `plain` and `json` output unchanged.
- Uses `md4x` AST output for markdown parsing.
- Uses Shiki highlighting for supported source languages.

## Global Rules

- Render markdown from the original file contents.
- Keep resolved-link summaries outside the markdown renderer.
- Separate formatted source from resolved-link summaries with one full-width
  divider line.
- Preserve one blank line between adjacent top-level markdown blocks unless a
  block type defines a tighter layout.
- Keep rendering deterministic for the same source text and width.
- Treat rich source width as one fixed terminal line with one leading and one
  trailing margin cell for divider rendering.

## Markdown

- Headings render as markdown source headings with their `#` markers preserved.
- Render headings in bold and color them by level:
  - `h1`: bold red
  - `h2` to `h6`: bold bright blue
- Thematic breaks render as full-width `─` divider lines with one leading and
  one trailing space and blank lines above and below.
- Lists and blockquotes own their indentation and prefixes.
- Unordered list markers render as `•`.
- Ordered list markers keep their numeric prefix.
- Wrap list-item continuation lines with a hanging indent that stays inside the
  list item.
- Paragraphs inside list items must remain visible in the rendered output.
- Tables render through Patram-owned cell padding, alignment, and borders.
- Inline code, emphasis, and links render through Patram-owned inline styling.
- Inline code renders with terminal-palette colors on a visible dark-gray
  terminal background, darker than blockquotes, and dimmed terminal-native text.
- Inline-code backticks stay present in copied text but visually disappear into
  the background color.
- Blockquotes render with terminal-palette surface colors and a left border.
- Blockquotes use a stronger surface than fenced code blocks.
- Blockquotes pad every row to the same visible width and include one trailing
  surface cell after the longest visible line.
- Fenced code blocks render as shaded blocks without an outer frame.
- Fenced code blocks use one shared surface color across the full row.
- Fenced code blocks use a visible dark-gray terminal surface instead of
  terminal black.
- Fenced code blocks do not render visible side-border glyphs in color mode.
- Fenced code blocks pad every row to the same visible width.
- Fenced markdown code blocks add one empty shaded spacer row below content.
- Fenced markdown code content is indented by one extra leading surface cell.
- Fenced code-block labels align to the right edge of the block.
- Fenced `mermaid` blocks render as Mermaid diagrams in Unicode ASCII-art form.
- Fenced `mermaid` blocks keep the same shaded block framing as other fenced
  markdown blocks.
- Fenced `mermaid` blocks may tighten node-box padding, but keep Mermaid's
  default inter-node spacing.
- Fenced `mermaid` blocks do not emit Mermaid-owned ANSI colors; Patram's block
  surface styling stays responsible for rich-mode coloring.
- Fenced code content uses Shiki colors when the language is supported.
- Unsupported fenced code languages fall back to Patram's unhighlighted shaded
  code block.

## Non-Markdown Source Files

- Render the full source as one highlighted shaded code block.
- Resolve the source language from the shown file path when possible.
- Keep indentation and line order exactly as written in the source file.
- Unsupported or unknown languages fall back to unhighlighted source text.
