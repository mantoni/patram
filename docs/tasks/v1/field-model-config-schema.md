# Define Field Model Config Schema

- Kind: task
- Status: done
- Tracked in: docs/plans/v1/field-model-redesign.md
- Decided by: docs/decisions/schema-defined-query-fields.md
- Decided by: docs/decisions/patram-structural-field-namespace.md
- Decided by: docs/decisions/class-based-config-vocabulary.md
- Decided by: docs/decisions/metadata-field-schema.md

- Add failing tests for the new top-level config vocabulary:
  - `classes`
  - `fields`
  - `class_schemas`
- Replace structural `kinds` terminology in config-loading code with `classes`.
- Model Patram-owned structural fields separately from metadata field
  definitions.
- Validate global metadata field definitions, display settings, and
  multiplicity.
- Validate `class_schemas` references to `classes` and `fields`.
- Reject metadata field names beginning with `$`.
- Reject config that tries to redefine Patram structural fields as metadata
  fields.
- Keep the write scope limited to config schema, config loading, and related
  tests.
