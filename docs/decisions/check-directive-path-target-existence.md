# Check Directive Path Target Existence Proposal

- kind: decision
- status: accepted
- tracked_in: docs/plans/v0/check-directive-path-target-existence.md

- `patram check` validates directive path references against repo file
  existence.
- Path-target existence checks apply to directive values that are configured as
  `type: path`.
- Path-target existence checks also apply to directive mappings that emit
  `target: path`, even when the directive does not declare a typed field.
- Directive path validation uses the same repo-relative target normalization as
  graph edge materialization.
- Missing directive targets report an origin-aware diagnostic at the directive
  location.

## Rationale

- Front-matter and JSDoc directives carry path references that are just as
  important as markdown links during repo validation.
- Reusing the existing normalization rules keeps path-class validation, graph
  materialization, and file-existence checks aligned.
- Checking both typed path directives and emitted path relations covers the
  repo's two ways of declaring path references.
