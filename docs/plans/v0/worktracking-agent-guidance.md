# Worktracking Agent Guidance Plan

- Kind: plan
- Status: active
- Tracked in: docs/roadmap/v0-dogfood.md
- Decided by: docs/decisions/worktracking-agent-guidance.md

## Goal

- Replace outdated taxonomy-first agent guidance with a worktracking-first
  `patram` workflow.
- Replace outdated stored query names and examples with the active worktracking
  queries.
- Document the CLI flow agents should use to discover, inspect, and validate
  work.

## Scope

- Replace the repo's stored query set in `.patram.json`.
- Update config and help tests to cover the new query set and examples.
- Rewrite `AGENTS.md`, `docs/patram.md`, and command reference docs for the new
  workflow.
- Update worktracking conventions so stored queries are documented in the
  correct layer.

## Order

1. Add failing tests for the replacement stored queries and help examples.
2. Replace the stored queries in repo config.
3. Update CLI help and command reference examples.
4. Rewrite agent-facing workflow docs around `queries`, `query`, `show`, and
   `check`.
5. Run validation and mark the task done.

## Acceptance

- `patram queries` lists worktracking-first stored query names.
- `patram query` help examples show the current workflow and query language.
- `AGENTS.md` and `docs/patram.md` teach the same CLI workflow.
- `docs/conventions/worktracking-v0.md` owns the documented lifecycle queries.
