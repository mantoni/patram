# Queries Output Proposal

- kind: decision
- status: accepted
- tracked_in: docs/plans/v0/output-contract-alignment.md

- Keep `patram queries` distinct from the entity-summary layout used by `query`
  and `show`.
- Render `patram queries` as two aligned columns:
  - stored query name
  - canonical rendered query term
- Do not add ASCII borders or box-drawing characters.
- Keep stored queries in stable name order.
- Keep `plain` and `rich` on the same two-column text layout.
- Wrap only the query-term column when needed.
- Use a hanging indent under the query-term column for wrapped terms.
- Emit `json` output as a `queries` array of `{ name, where }` objects.

## Rationale

- Stored queries are named filters, not graph entities, so the entity-summary
  block shape would add noise instead of structure.
- Two aligned columns keep the catalog scanable while making query names and
  terms easier to distinguish at a glance.
- Borderless layout keeps the command readable in terminals and snapshots
  without introducing table noise.
- Stable ordering keeps docs, snapshots, and shell use predictable.
