# Docs Structure Cleanup Plan

- Kind: plan
- Status: done
- Decided by: docs/decisions/work-item-structure.md

## Goal

- Separate roadmap docs from change plans.
- Make `docs/structure.md` part of the default reading path for agents.

## Scope

- Update the docs taxonomy.
- Move change plans into `docs/plans/v0/`.
- Rewrite links that still point to the moved files.

## Order

1. Document the work item structure decision.
2. Move the change plans and re-label them.
3. Update links and agent-facing docs.
4. Run validation.

## Acceptance

- `docs/roadmap/` contains only milestone roadmaps.
- `docs/plans/v0/` contains the change-level plans.
- Agents are directed to `docs/structure.md`.
- `npm run all` passes.
