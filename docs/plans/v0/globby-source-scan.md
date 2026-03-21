# Globby Source Scan Plan

- Kind: plan
- Status: done
- Tracked in: docs/roadmap/v0-dogfood.md
- Decided by: docs/decisions/globby-source-scan.md

## Goal

- Replace the custom `.gitignore` implementation with `globby`.
- Preserve Patram source scan output shape and ordering.

## Scope

- Add red tests for `.gitignore` semantics that the custom parser gets wrong.
- Replace recursive source discovery with `globby`.
- Remove the custom `.gitignore` parser module.
- Update package metadata for the new dependency.

## Order

1. Add failing tests for anchored `.gitignore` patterns.
2. Implement source discovery with `globby`.
3. Remove the custom `.gitignore` parser code.
4. Run required validation and mark the plan done.

## Acceptance

- Root-anchored `.gitignore` rules only apply at the matching root path.
- Nested `.gitignore` rules and negations still affect their subtree.
- Source scan results remain repo-relative and sorted.
- `npm run all` passes.
