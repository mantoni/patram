# Rich Source Separated List Spacing Proposal

- Kind: decision
- Status: accepted
- Tracked in: docs/plans/v0/fix-rich-source-separated-list-spacing.md

- Preserve one visible blank line in `patram show` rich markdown output when the
  original source contains a blank line between adjacent top-level list items.
- Keep `plain` and `json` `show` output unchanged.
- Derive the preserved gap from the original markdown source because `md4x`
  flattens adjacent list items into one list node.
- Limit the first pass to top-level list spacing so the fix stays aligned with
  the documented top-level block-spacing convention.

## Rationale

- Two top-level list groups separated by a blank line currently render as one
  uninterrupted list in rich output.
- The rich renderer already owns markdown block spacing, so it should preserve
  source-authored list-group gaps that the AST does not retain.
- Restricting the first pass to top-level items fixes the reported regression
  without broadening list-layout behavior beyond the documented convention.
