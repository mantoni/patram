# Compact Two-Column Terminal Output Proposal

- kind: decision
- status: accepted
- tracked_in: docs/plans/v0/compact-two-column-terminal-output.md

- Render `patram queries`, `patram query`, and `patram refs` as compact blocks
  with:
  - one two-column title row
  - one body block indented by two spaces
- Keep `plain` and `rich` on the same text layout.
- For `patram queries`:
  - use the stored query name as the left title
  - use the optional stored query description as the right title
  - render the canonical query clause in the indented body
- For `patram query` and `patram refs` node summaries:
  - use the current identity header as the left title
  - flatten visible metadata rows into one bracketed right-title label
  - omit the right title completely when there is no visible metadata
  - render the node title and optional description as consecutive indented body
    lines with no blank line between them
- Keep `refs` relation headings and counts unchanged.
- Keep incoming `refs` node summaries indented by two spaces under their
  relation headings.
- Size the left title column from the widest visible left title in the rendered
  section.
- In TTY output, keep right titles on one line and truncate only the right title
  when it exceeds the remaining width.
- Outside TTY output, do not wrap or truncate title rows.
- In TTY output, wrap indented body text to the available width while preserving
  the body indent.
- Keep `json` output unchanged.

## Rationale

- A shared compact block layout makes `queries`, `query`, and `refs` easier to
  scan as one family of exploration commands.
- Moving metadata into the title row removes repeated vertical gaps without
  hiding the most useful scan keys.
- Truncating only the right title in TTY output preserves the stronger identity
  signal on the left while keeping dense terminal listings stable.
- Omitting empty bracket labels avoids visual noise on nodes that do not expose
  useful metadata.
