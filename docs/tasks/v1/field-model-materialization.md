# Implement Field Materialization Rules

- Kind: task
- Status: pending
- Tracked in: docs/plans/v1/field-model-redesign.md
- Decided by: docs/decisions/patram-structural-field-namespace.md
- Decided by: docs/decisions/metadata-field-schema.md
- Decided by: docs/decisions/field-materialization-conflicts.md
- Blocked by: docs/tasks/v1/field-model-config-schema.md

- Add failing graph-materialization and validation tests for:
  - Patram structural field population
  - metadata field population
  - single-valued conflict errors
  - multi-valued set semantics
  - deterministic `title` fallback
- Move structural graph identity and locator semantics to:
  - `$id`
  - `$class`
  - `$path`
- Restrict node-field mappings to Patram structural fields or declared metadata
  fields.
- Detect conflicting values on single-valued metadata fields.
- Deduplicate and deterministically order multi-valued metadata fields.
- Implement `title` precedence:
  - explicit metadata
  - parser-derived title
  - deterministic fallback from `$path` or `$id`
- Keep the write scope limited to graph materialization, graph identity,
  directive-value checks, and related tests.
