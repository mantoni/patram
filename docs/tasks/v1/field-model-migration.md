# Migrate Repo To The New Field Model

- kind: task
- status: done
- tracked_in: docs/plans/v1/field-model-redesign.md
- decided_by: docs/decisions/class-based-config-vocabulary.md
- decided_by: docs/decisions/patram-structural-field-namespace.md
- decided_by: docs/decisions/query-output-open-metadata.md
- decided_by: docs/decisions/query-validation-lifecycle.md
- Blocked by: docs/tasks/v1/field-model-output.md

- Add failing repo-level tests for the migrated config, queries, and output.
- Migrate `.patram.json` to:
  - `classes`
  - `fields`
  - `class_schemas`
  - `$id`
  - `$class`
  - `$path`
- Migrate stored queries and derived summary expressions to the new structural
  field names.
- Update docs, help text, and examples to the new field model.
- Dogfood the new config and query model in this repo.
- Run the full required validation and leave the repo in a passing state.
- Keep the write scope limited to repo config, docs, repo integration tests, and
  migration-facing help surfaces.
