# Stored Query Keyword Colors Proposal

- Kind: decision
- Status: accepted
- Tracked in: docs/plans/v0/fix-stored-query-keyword-colors.md

- Keep parsed stored-query term styling in `queries`.
- Use gray for stored query operators.
- Use gray for stored query boolean keywords such as `and`, `or`, and `not`.
- Keep stored query field names and literal values on the default foreground
  color.
- Narrow the `queries` rich-output color policy from
  `docs/decisions/rich-output-colors.md` for boolean keywords only.

## Rationale

- Boolean keywords and symbolic operators serve the same structural role in the
  rendered where clause.
- Rendering both classes in gray reduces the visual emphasis on connective text
  while keeping the parsed-term layout intact.
- This keeps `queries` easier to scan when many stored queries share long
  boolean clauses.
