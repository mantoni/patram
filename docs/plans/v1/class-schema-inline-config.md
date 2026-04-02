# Class Schema Inline Config Plan

- kind: plan
- status: active
- decided_by: docs/decisions/class-schema-inline-config.md
- decided_by: docs/decisions/metadata-field-schema.md
- decided_by: docs/decisions/class-based-config-vocabulary.md

## Goal

- Inline class-local schema under `classes.<name>.schema`.
- Remove top-level `class_schemas` from Patram config.
- Keep the repo and runtime on a single breaking-change config model.

## Scope

- Config schema and config-loading validation.
- Runtime config normalization and type definitions.
- Repo config migration.
- Tests and docs that describe config vocabulary.
- No backward compatibility layer.

## Order

1. Add failing tests for `classes.<name>.schema` and rejection of top-level
   `class_schemas`.
2. Refactor config parsing and normalization to read class-local schema from the
   `classes` section.
3. Update runtime consumers to resolve class schema from the new normalized
   config.
4. Migrate repo config and docs.
5. Run required validation and repo checks.

## Acceptance

- Config accepts `classes.<name>.schema`.
- Config rejects top-level `class_schemas`.
- Class-schema validation still checks referenced fields and path classes.
- Repo config uses the new shape everywhere.
- `npm run all` passes.
