# Fix Repo Relative Directive Targets Plan

- kind: plan
- status: active
- tracked_in: docs/roadmap/v0-dogfood.md
- decided_by: docs/decisions/repo-relative-directive-targets.md

## Goal

- Keep repo-relative directive targets queryable without materializing duplicate
  `docs/...` path prefixes.

## Scope

- Add a failing graph-materialization test for a markdown directive that points
  at an existing repo-relative plan path.
- Prefer an indexed repo-relative document path for directive targets when the
  directive value already matches one.
- Preserve source-relative resolution for markdown and JSDoc link claims.

## Order

1. Add a failing regression test for duplicated `docs/decisions/docs/...`
   targets.
2. Update directive path-target resolution to recognize indexed repo-relative
   document paths.
3. Run validation and commit a fixup for the introducing commit.

## Acceptance

- `npx vitest run lib/build-graph.test.js test/repo-worktracking-rollups.test.js`
  passes.
- `patram query --where "path^=docs/decisions/docs/"` returns no matches.
- `patram query --where "none(in:tracked_in, kind=task)"` no longer lists
  non-existent duplicated `docs/...` document paths.
