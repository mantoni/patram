# Directive Type Validation Plan

- Kind: plan
- Status: active
- Tracked in: docs/roadmap/v0-dogfood.md
- Decided by: docs/decisions/markdown-metadata-directive-syntax.md
- Decided by: docs/decisions/jsdoc-metadata-directive-syntax.md

## Goal

- Make directive values checkable without changing directive parsing semantics.
- Let repositories declare expected directive value types in config.
- Fail `patram check` with precise diagnostics when directive values violate
  those declared types.

## Scope

- Keep markdown and JSDoc directives string-valued at parse time.
- Add config-defined directive type declarations for supported directive names.
- Validate directive values during project checking and config loading.
- Start with scalar and path-oriented types such as `string`, `integer`, `enum`,
  `path`, and `glob`.
- Report file, line, directive name, expected type, and invalid value in
  diagnostics.
- Keep graph materialization unchanged for directives that pass validation.

## Order

1. Record a directive-typing decision that defines the config shape, supported
   value types, and which validations happen at config load versus check time.
2. Update the config and check conventions with typed-directive examples and
   expected diagnostics.
3. Add failing config, parser-to-check, and CLI tests for valid and invalid
   directive values across markdown and JSDoc inputs.
4. Implement config parsing for directive type declarations.
5. Implement typed directive validation in the check pipeline with origin-aware
   diagnostics.
6. Refactor directive-validation helpers if needed.
7. Run validation.

## Acceptance

- Repositories can declare expected types for selected directive names in
  `.patram.json`.
- `patram check` fails when a directive value violates its declared type.
- Diagnostics identify the source file and origin of the invalid directive.
- Directives that are not covered by type declarations keep current behavior.
- Directive parsing stays string-based and backward-compatible.
- `npm run all` passes.
