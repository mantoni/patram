# Directive Type Validation Plan

- kind: plan
- status: active
- tracked_in: docs/roadmap/v0-dogfood.md
- decided_by: docs/decisions/markdown-metadata-directive-syntax.md
- decided_by: docs/decisions/jsdoc-metadata-directive-syntax.md
- decided_by: docs/decisions/markdown-directive-style-validation.md
- decided_by: docs/decisions/patram-worktracking.md

## Goal

- Make directive values checkable without changing directive parsing semantics.
- Let repositories declare expected directive value types in config.
- Fail `patram check` with precise diagnostics when directive values violate
  those declared types.
- Let repositories declare document-level metadata rules that combine directive
  values, multiplicity, and placement constraints.

## Scope

- Keep markdown and JSDoc directives string-valued at parse time.
- Add config-defined directive type declarations for supported directive names.
- Validate directive values during project checking and config loading.
- Start with scalar and path-oriented types such as `string`, `integer`, `enum`,
  `path`, and `glob`.
- Add config-defined per-kind metadata schemas with required, optional, and
  repeated directives.
- Validate directive multiplicity such as exactly-one and one-or-more.
- Validate value sets that depend on document kind, such as `status` enums per
  worktracking kind.
- Validate path-class constraints for relation-style directives such as
  `docs/roadmap/`, `docs/plans/`, `docs/decisions/`, `docs/tasks/`, and
  `docs/research/`.
- Validate document placement rules such as which path prefixes are allowed for
  which `kind` values.
- Report file, line, directive name, expected type, and invalid value in
  diagnostics.
- Report missing required directives, forbidden directives, multiplicity
  violations, and placement violations with origin-aware diagnostics.
- Keep graph materialization unchanged for directives that pass validation.

## Order

1. Record a directive-typing decision that defines the config shape, supported
   value types, schema constraints, and which validations happen at config load
   versus check time.
2. Update the config and check conventions with typed-directive and per-kind
   schema examples plus expected diagnostics.
3. Add failing config, parser-to-check, and CLI tests for valid and invalid
   directive values, missing required directives, multiplicity violations,
   invalid per-kind status values, invalid relation target classes, and invalid
   document placement across markdown and JSDoc inputs.
4. Implement config parsing for directive type declarations and per-kind
   metadata schemas.
5. Implement typed directive and schema validation in the check pipeline with
   origin-aware diagnostics.
6. Refactor directive-validation helpers if needed.
7. Run validation.

## Acceptance

- Repositories can declare expected types for selected directive names in
  `.patram.json`.
- `patram check` fails when a directive value violates its declared type.
- Repositories can declare per-kind required and repeated directives plus path
  and status constraints.
- `patram check` fails when required directives are missing, forbidden
  directives are present, multiplicity rules are violated, or document placement
  does not match its kind.
- Diagnostics identify the source file and origin of the invalid directive.
- Directives that are not covered by type declarations keep current behavior.
- Directive parsing stays string-based and backward-compatible.
- `npm run all` passes.
