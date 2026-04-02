# Source Rendering Terminal Surfaces Proposal

- kind: decision
- status: accepted
- tracked_in: docs/plans/v0/source-rendering-terminal-surfaces.md

- Use terminal standard ANSI palette colors for Patram-owned rich-source
  surfaces and accents.
- Do not use renderer-owned custom RGB or hex colors for headings, blockquote
  surfaces, blockquote borders, code-block surfaces, code-block borders, or
  inline-code surfaces.
- Render markdown headings in bold.
- Use a terminal bright-blue accent for `h2` to `h6`.
- Keep Shiki token foreground colors for syntax-highlighted code content.
- Render blockquotes as padded boxes:
  - add one trailing surface cell after the longest visible quote line
  - pad every rendered quote row to the same visible width
- Give blockquotes a more visible terminal surface than fenced code blocks.
- Render fenced and direct-source code blocks as padded boxes:
  - use one shared surface color from the first cell through the last cell
  - pad every rendered row to the same visible width
- Do not render visible left or right border glyphs around fenced code blocks.
- Use a darker terminal surface for inline code than plain text and dim the
  inline-code text without forcing a custom foreground color.
- Use a visible terminal gray surface for inline code and fenced code blocks
  rather than terminal black, which may match the default background.
- Use a darker terminal gray slot for inline code and fenced code blocks than
  the blockquote surface.
- Add one extra shaded spacer row below fenced markdown code blocks.
- Indent fenced markdown code content by one extra leading surface cell.
- Wrap list-item continuation lines with a hanging indent so width-based wraps
  stay inside the list item.

## Rationale

- Terminal palette colors adapt to the user's theme instead of forcing Patram's
  own RGB choices onto the output.
- Quote and code surfaces read as intentional blocks only when every line shares
  the same visible width.
- Blockquotes and code blocks need distinct surfaces so they do not collapse
  into each other or into the surrounding document.
- Secondary headings need a non-warning accent so they do not collide with the
  terminal yellow used for warnings elsewhere in Patram.
- Inline code needs separation from paragraph text without reading like a large
  callout block.
- Width-based list wrapping must be renderer-owned; relying on terminal wrapping
  loses the list indentation.
