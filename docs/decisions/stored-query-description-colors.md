# Stored Query Description Colors Proposal

- Kind: decision
- Status: accepted
- Tracked in: docs/plans/v0/fix-stored-query-description-colors.md

- Keep stored-query descriptions in `queries` rich output on the same lines and
  indentation as plain output.
- Render stored-query descriptions in gray in `rich` output.
- Keep stored-query names green and keep parsed stored-query terms on their
  existing colors.
- Narrow the `queries` rich-output color policy from
  `docs/decisions/rich-output-colors.md` for description lines only.

## Rationale

- Stored-query descriptions are supporting copy rather than primary query
  syntax.
- Rendering descriptions in gray preserves the compact layout while making the
  query name and where clause remain the visual focus.
- Keeping the plain and rich layouts identical avoids output-mode-specific
  wrapping or alignment differences.
