# Agent Guidance Taxonomy Queries Plan

- kind: plan
- status: active
- tracked_in: docs/roadmap/v0-dogfood.md
- decided_by: docs/decisions/agent-guidance-taxonomy-queries.md

## Goal

- Make the repo taxonomy easier for coding agents to discover and use through
  stored queries plus cleaner agent-facing documentation.

## Scope

- Add stored queries for command implementations and term usage.
- Update repo config tests and taxonomy coverage tests.
- Rewrite `docs/patram.md` to explain the repo taxonomy and common agent
  workflows.
- Trim overlap in `AGENTS.md` and point structure questions to
  `docs/structure.md`.

## Order

1. Add failing tests for the new stored queries.
2. Extend `.patram.json` and the repo taxonomy tests.
3. Rewrite `docs/patram.md` and simplify `AGENTS.md`.
4. Run validation and commit the cleanup.

## Acceptance

- `patram query command-implementations` returns the command implementation
  entrypoints.
- `patram query term-usage` returns the docs and source anchors tied to core
  graph terms.
- `docs/patram.md` explains command and term taxonomy for agents working in this
  repo.
- `AGENTS.md` points to `docs/structure.md` instead of duplicating the repo map.
- `npm run all` passes.
