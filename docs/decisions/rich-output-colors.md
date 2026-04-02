# Rich Output Colors Proposal

- kind: decision
- status: accepted
- tracked_in: docs/plans/v0/output-contract-alignment.md

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
- Parse stored query terms before styling them in `rich` output.
- Use semantic highlighting for stored query terms in `queries`:
  - field names keep the default foreground color
  - query operators use gray
  - boolean keywords such as `and`, `or`, and `not` use yellow
  - literal values keep the default foreground color
- Keep severity colors unchanged:
  - red for errors
  - yellow for warnings and empty query summaries

## Rationale

- Green gives Patram node references a distinct product identity without
  competing with severity colors.
- Gray preserves the visual hierarchy for secondary text more clearly than dim
  on common terminal themes.
- Semantic term highlighting makes stored queries easier to scan without
  changing the plain-text layout.
- Keeping field names uncolored reduces noise in dense stored query lists.
- Highlighting from parsed query structure is more robust than styling raw text
  after rendering.
