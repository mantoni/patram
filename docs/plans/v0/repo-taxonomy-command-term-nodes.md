# Repo Taxonomy Command And Term Nodes Plan

- kind: plan
- status: superseded
- tracked_in: docs/roadmap/v0-dogfood.md
- decided_by: docs/decisions/repo-taxonomy-command-term-nodes.md
- Superseded by: docs/plans/v0/non-document-semantic-ids.md

## Goal

- Add canonical `command` and `term` nodes so coding agents can navigate from
  CLI surface area and core graph vocabulary to the docs and source files that
  define or implement them.

## Scope

- Extend `.patram.json` with `command` and `term` kinds plus their relations and
  mappings.
- Add canonical markdown documents under `docs/reference/commands/` and
  `docs/reference/terms/`.
- Link the implemented v0 CLI commands and selected core graph terms from docs
  and JSDoc source anchors.
- Make query output handle non-document nodes that are keyed by canonical paths.
- Correct product docs to match the implemented v0 command surface.
- Add repo contract coverage for the taxonomy config and indexed nodes.

## Order

1. Add failing tests for repo config, graph materialization, and query output.
2. Update graph materialization and query rendering for path-backed custom
   kinds.
3. Extend `.patram.json` with taxonomy kinds, relations, mappings, and stored
   queries.
4. Add canonical command and term reference docs plus source/doc annotations.
5. Run validation and mark the plan done after the taxonomy is queryable.

## Acceptance

- `patram query command-taxonomy` returns the canonical v0 command docs.
- `patram query term-taxonomy` returns the canonical core term docs.
- Source anchor files emit `implements_command`, `about_command`, and
  `uses_term` relations to the canonical nodes.
- Query output renders `command` and `term` nodes without throwing.
- `docs/patram.md` lists only the implemented v0 commands.
- `npm run all` passes.
