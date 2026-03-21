# Rich Output Colors Proposal

- Kind: decision
- Status: accepted
- Tracked in: docs/plans/v0/output-contract-alignment.md

- Use green as the shared accent color for Patram node references in `rich`
  output:
  - `document <path>` headers in `query`, `show`, and `check`
  - stored query names in `queries`
- Use gray for secondary structural text in `rich` output:
  - query hints such as `Try: ...`
  - `show` divider lines
  - resolved-link reference numbers
  - diagnostic locations
  - diagnostic codes
  - the secondary success-summary line in `check`
- Keep metadata keys uncolored in `rich` output.
- Keep stored query filters uncolored in `rich` output.
- Keep severity colors unchanged:
  - red for errors
  - yellow for warnings and empty query summaries

## Rationale

- Green gives Patram node references a distinct product identity without
  competing with severity colors.
- Gray preserves the visual hierarchy for secondary text more clearly than dim
  on common terminal themes.
- Uncolored metadata keys and stored query filters keep structural text closer
  to established CLI conventions such as Git output.
