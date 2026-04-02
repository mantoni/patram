# Show Footnote Compact Metadata Proposal

- kind: decision
- status: accepted
- tracked_in: docs/plans/v0/show-footnote-compact-metadata.md

- Keep `patram show` resolved-link footnotes aligned with the compact summary
  layout used by `patram query` and `patram refs`.
- Render visible resolved-link metadata inline as one parenthesized `key=value`
  label on the footnote header row.
- In TTY output, apply the same header-row truncation rules used by the compact
  query-family layout.
- Keep the resolved-link content block indented under the footnote header.

## Rationale

- `show`, `query`, and `refs` should expose the same entity-summary shape.
- Inline metadata is denser than multi-line metadata rows in footnotes.
- Shared truncation rules keep narrow-terminal behavior predictable.
