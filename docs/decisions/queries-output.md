# Queries Output Proposal

- Kind: decision
- Status: accepted
- Tracked in: docs/plans/v0/output-contract-alignment.md

- Keep `patram queries` distinct from the entity-summary layout used by `query`
  and `show`.
- Render each stored query on one line as `<name> <where>`.
- Keep stored queries in stable name order.
- Keep `plain` and `rich` on the same one-line-per-query layout.
- Emit `json` output as a `queries` array of `{ name, where }` objects.

## Rationale

- Stored queries are named filters, not graph entities, so the entity-summary
  block shape would add noise instead of structure.
- One-line entries keep scanability high when the command is used as a catalog
  of available shortcuts.
- Stable ordering keeps docs, snapshots, and shell use predictable.
