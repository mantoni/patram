# Source Anchor Dogfooding Plan

- kind: plan
- status: active
- tracked_in: docs/roadmap/v0-dogfood.md
- decided_by: docs/decisions/source-anchor-dogfooding.md
- decided_by: docs/decisions/jsdoc-metadata-directive-syntax.md

## Goal

- Make `patram query ...` useful for coding agents on this repo by indexing a
  curated set of JavaScript source anchors alongside the existing docs graph.

## Scope

- Extend repo include globs to scan JavaScript source files in `bin/`, `lib/`,
  `scripts/`, and `test/`.
- Mirror the repo's markdown graph mappings for supported JSDoc directives.
- Add source-anchor JSDoc blocks to the selected production, test, and release
  files.
- Add stored queries for the stable source-anchor kinds.
- Add repo contract tests for source-anchor config and indexed source anchors.
- Keep helper and leaf files intentionally covered through anchor ownership
  instead of tagging every file.

## Order

1. Add the decision and source-anchor convention docs.
2. Add failing repo tests for source-anchor config and indexed anchors.
3. Update `.patram.json` include globs, mirrored JSDoc mappings, and stored
   queries.
4. Add anchor JSDoc blocks to the selected source and test files.
5. Run validation and mark the plan done after the sweep lands.

## Acceptance

- `.patram.json` scans repo docs plus curated JavaScript source directories.
- JSDoc `kind`, `status`, `blocked_by`, `decided_by`, `implements`, and
  `tracked_in` directives materialize with the same graph behavior as markdown
  directives.
- `patram query source-parse`, `source-graph`, and `source-output` return the
  expected anchored files in this repo.
- The repo graph contains source anchors in `bin/`, `lib/`, `scripts/`, and
  `test/`.
- Every untagged source area listed in conventions has an explicit coverage
  owner.
- `npm run all` passes.
