# Implement Field Model Query Semantics

- Kind: task
- Status: done
- Tracked in: docs/plans/v1/field-model-redesign.md
- Decided by: docs/decisions/schema-defined-query-fields.md
- Decided by: docs/decisions/patram-structural-field-namespace.md
- Decided by: docs/decisions/class-based-config-vocabulary.md
- Decided by: docs/decisions/type-driven-query-operators.md
- Decided by: docs/decisions/query-validation-lifecycle.md
- Blocked by: docs/tasks/v1/field-model-config-schema.md

- Add failing parser, validator, and evaluator tests for:
  - `$id`
  - `$class`
  - `$path`
  - declared metadata fields
  - type-driven operator errors
- Update query parsing and semantic validation to resolve:
  - Patram structural fields from the reserved `$` namespace
  - metadata fields from explicit schema
- Keep the existing operator syntax while removing hard-coded metadata
  field-name allowlists.
- Validate stored queries at config-load time against the new field model.
- Validate ad hoc queries at runtime with the same semantic rules.
- Update query inspection and stored-query layout helpers to render the new
  structural field names.
- Keep the write scope limited to query parsing, query evaluation, query
  inspection, stored-query formatting, and related tests.
