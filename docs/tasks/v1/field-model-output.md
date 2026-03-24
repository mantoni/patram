# Implement Open Metadata Output

- Kind: task
- Status: done
- Tracked in: docs/plans/v1/field-model-redesign.md
- Decided by: docs/decisions/patram-structural-field-namespace.md
- Decided by: docs/decisions/metadata-field-schema.md
- Decided by: docs/decisions/query-output-open-metadata.md
- Blocked by: docs/tasks/v1/field-model-query-semantics.md
- Blocked by: docs/tasks/v1/field-model-materialization.md

- Add failing output tests for:
  - query JSON shape
  - show JSON shape
  - resolved-link JSON shape
  - plain-text structural header
  - plain-text metadata visibility and ordering
- Change JSON query output to expose:
  - `$id`
  - `$class`
  - `$path` when present
  - `title`
  - `fields` for repo metadata
- Omit `$path` from JSON when it is missing.
- Keep `title` as the indented label in plain-text output.
- Render only visible metadata fields on the second line of plain-text output.
- Use `$path` in the header when present and otherwise render the key portion of
  `$id`.
- Honor global metadata display settings for hidden fields and display order.
- Keep the write scope limited to output view types, renderers, show output, and
  related tests.
