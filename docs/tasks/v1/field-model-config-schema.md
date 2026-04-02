# Define Field Model Config Schema

- kind: task
- status: done
- tracked_in: docs/plans/v1/field-model-redesign.md
- decided_by: docs/decisions/schema-defined-query-fields.md
- decided_by: docs/decisions/patram-structural-field-namespace.md
- decided_by: docs/decisions/class-based-config-vocabulary.md
- decided_by: docs/decisions/metadata-field-schema.md

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
