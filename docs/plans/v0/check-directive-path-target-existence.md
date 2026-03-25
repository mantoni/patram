# Check Directive Path Target Existence Plan

- Kind: plan
- Status: done
- Tracked in: docs/roadmap/v0-dogfood.md
- Decided by: docs/decisions/check-directive-path-target-existence.md

## Goal

- Make `patram check` fail when a directive path reference resolves to a missing
  repo file.

## Scope

- Keep directive parsing unchanged.
- Reuse existing repo-relative path normalization for directive targets.
- Validate both typed path directives and path-target relation mappings.
- Report missing targets with origin-aware diagnostics across markdown and JSDoc
  directives.

## Order

1. Record the directive path-target existence rule.
2. Add failing tests for missing front-matter and JSDoc directive targets.
3. Implement directive path-target existence validation in the check pipeline.
4. Run validation and mark the plan done.

## Acceptance

- `patram check` reports a diagnostic when a front-matter path directive points
  to a missing repo file.
- `patram check` reports a diagnostic when a JSDoc path directive points to a
  missing repo file.
- Existing path-class validation still runs on directive path values.
- Existing markdown-link broken-link validation is unchanged.
