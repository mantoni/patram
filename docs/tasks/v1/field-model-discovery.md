# Add Field Discovery Workflow

- Kind: task
- Status: done
- Tracked in: docs/plans/v1/field-model-redesign.md
- Decided by: docs/decisions/metadata-field-schema.md
- Decided by: docs/decisions/query-validation-lifecycle.md
- Decided by: docs/decisions/field-discovery-workflow.md
- Blocked by: docs/tasks/v1/field-model-config-schema.md
- Blocked by: docs/tasks/v1/field-model-materialization.md

- Add failing CLI and discovery tests for a dedicated `fields` command group.
- Implement advisory field discovery that suggests:
  - field name
  - likely type
  - likely multiplicity
  - likely class usage
  - confidence
  - conflicting evidence
  - evidence references
- Keep discovery separate from `patram check`.
- Never activate discovered schema automatically.
- Never suggest `$`-prefixed repo metadata fields.
- Never suggest hidden-field or display-order settings.
- Provide both human-readable and JSON output modes for discovery.
- Keep the write scope limited to discovery command plumbing, discovery logic,
  discovery output, and related tests.
