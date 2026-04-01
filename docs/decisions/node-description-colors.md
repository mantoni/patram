# Node Description Colors Proposal

- Kind: decision
- Status: accepted
- Tracked in: docs/plans/v0/fix-node-description-colors.md

- Keep node descriptions in `query`, `refs`, and `show` rich output on the same
  lines and indentation as plain output.
- Render node description lines in gray in `rich` output.
- Keep node titles on the default foreground color.
- Keep metadata labels, summary rows, and structural headers on their existing
  colors.
- Narrow the `query`, `refs`, and `show` rich-output color policy from
  `docs/decisions/rich-output-colors.md` for description lines only.

## Rationale

- Node descriptions are supporting copy rather than the primary identity handle
  in compact result lists.
- Rendering descriptions in gray preserves the compact layout while making the
  header row and title remain the visual focus.
- Keeping the plain and rich layouts identical avoids output-mode-specific
  wrapping or indentation differences.
