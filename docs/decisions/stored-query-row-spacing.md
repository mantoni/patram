# Stored Query Row Spacing Proposal

- Kind: decision
- Status: accepted
- Tracked in: docs/plans/v0/fix-stored-query-row-spacing.md

- Keep `patram queries` rendering each stored query as one visual block.
- Render one blank line after every stored query block in terminal output.
- When a stored query defines a description, keep the description in the same
  block directly after the rendered query row with the existing hanging indent.
- When a stored query omits a description, still render the trailing blank line
  after the query row.
- Keep `json` output unchanged.
- Narrow the spacing policy from `docs/decisions/stored-query-descriptions.md`
  for terminal rendering only.

## Rationale

- Consistent spacing between all stored queries makes the list easier to scan.
- Treating each query as one block avoids mode-specific or description-specific
  spacing rules.
- Keeping the description attached to the query row preserves the compact layout
  that already exists in plain and rich output.
