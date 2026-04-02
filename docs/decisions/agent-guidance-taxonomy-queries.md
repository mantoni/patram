# Agent Guidance Taxonomy Queries Proposal

- kind: decision
- status: accepted
- tracked_in: docs/roadmap/v0-dogfood.md

- Add stored queries for taxonomy-driven agent exploration:
  `command-implementations` and `term-usage`.
- Keep `AGENTS.md` as a concise entrypoint for repo workflow and orientation.
- Keep `docs/structure.md` as the canonical repo documentation map.
- Explain the repo-specific `command` and `term` taxonomy workflow in
  `docs/patram.md`.
- Avoid duplicating the repo map in `AGENTS.md` when `docs/structure.md` already
  owns it.

## Rationale

- Agents need stable, named entrypoints for common repo-exploration flows.
- A short `AGENTS.md` reduces repeated maintenance and drift.
- `docs/patram.md` is the right place to explain how this repo uses Patram to
  expose commands, terms, and source anchors.
