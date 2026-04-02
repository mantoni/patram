# Check Multiple Paths Plan

- kind: plan
- status: done
- tracked_in: docs/roadmap/v0-dogfood.md

## Goal

- Make `patram check` accept and validate more than one path in one run.

## Scope

- Update the documented CLI contract from one optional path to zero or more
  paths.
- Parse multiple `check` path arguments without changing other commands.
- Resolve all requested scopes against one project root and reject mixed roots.
- Union and deduplicate selected files and diagnostics across overlapping
  targets.

## Order

1. Update the decision and command-help contract.
2. Add failing parser, target-resolution, and CLI behavior tests.
3. Implement multi-path target resolution and scoped union selection.
4. Run validation and mark the plan done.

## Acceptance

- `patram check docs docs/patram.md` succeeds and scans each matching file once.
- `patram check docs/tasks docs/plans/v0` reports diagnostics from both scopes.
- `patram check` still defaults to the current project directory.
- `patram check <path-a> <path-b>` fails with a clear error when the paths
  resolve to different project roots.
