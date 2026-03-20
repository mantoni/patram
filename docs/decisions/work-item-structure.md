# Work Item Structure Proposal

- Kind: decision
- Status: accepted
- Tracked in: docs/plans/v0/docs-structure-cleanup.md

- Keep milestone and version planning in `docs/roadmap/`.
- Store change-level implementation plans in `docs/plans/<version>/`.
- Keep atomic work items in `docs/tasks/<version>/`.
- Point agents to `docs/structure.md` alongside `docs/patram.md`.

## Rationale

- Keep milestone sequencing separate from per-change execution details.
- Preserve a distinct place for small, atomic tasks.
- Make the expected doc placement obvious to humans and agents before they edit.
