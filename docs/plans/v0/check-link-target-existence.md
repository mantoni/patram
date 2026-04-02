# Check Link Target Existence Plan

- kind: plan
- status: done
- tracked_in: docs/roadmap/v0-dogfood.md

## Goal

- Make `patram check` accept markdown links to existing repo files even when
  Patram does not index those target files.

## Scope

- Keep markdown link parsing and graph target normalization unchanged.
- Change broken-link validation to compare `links_to` targets against repo file
  existence instead of indexed source-file paths.
- Preserve `.gitignore` handling and repo-root boundaries during validation.

## Order

1. Document the link-target existence rule.
2. Add a failing check test for a markdown link to an existing `*.js` file with
   default config.
3. Implement repo file listing for `check`.
4. Run validation and mark the plan done.

## Acceptance

- With no `.patram.json`, `patram check` passes for a markdown link to an
  existing repo `*.js` file.
- `patram check` still reports missing repo files as broken links.
- Links that normalize outside the repo root still fail validation.
