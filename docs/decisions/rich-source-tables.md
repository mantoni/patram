# Rich Source Tables Proposal

- kind: decision
- status: accepted
- tracked_in: docs/plans/v0/rich-source-tables.md

- Render markdown tables in `patram show` rich output with box-drawing borders.
- Use `┌─┬─┐`, `├─┼─┤`, and `└─┴─┘` style frames sized to the rendered cell
  content.
- Color table borders gray in rich color mode.
- Color table header cells red in rich color mode.
- Apply markdown alignment markers to table columns:
  - `:--` left-aligns the column
  - `:-:` centers the column
  - `--:` right-aligns the column
- Measure rendered cell width and pad each column to the widest visible cell in
  that column.
- Keep plain and json output unchanged.

## Rationale

- Markdown-style `|` table text is readable, but rich mode should use the extra
  terminal surface to show structure more clearly.
- Box-drawing borders make headers, body rows, and column boundaries easier to
  scan in the terminal than markdown separator syntax.
- Alignment markers are document content and should affect the rendered table
  layout instead of being discarded after parsing.
- Width-aware layout keeps the table readable when header and body cells have
  different visible lengths.
