# Types And Fields Config Proposal

- kind: decision
- status: accepted
- tracked_in: docs/plans/v2/types-and-fields-config.md
- supersedes: docs/decisions/class-based-config-vocabulary.md
- supersedes: docs/decisions/class-schema-inline-config.md
- supersedes: docs/decisions/metadata-field-schema.md
- supersedes: docs/decisions/structural-identity-functions.md

- Patram config keeps one project file: `.patram.json`.
- `.patram.json` keeps:
  - `include`
  - `types`
  - `fields`
  - `queries`
- Patram removes user-authored config sections:
  - `classes`
  - `relations`
  - `mappings`
  - `path_classes`
  - `class_schemas`
- `types` is the only user-authored document classification model.
- `types.<name>` supports exactly one identity mode:
  - `in`
  - `defined_by`
- `in` promotes path-backed document types by source path glob.
- `defined_by` promotes semantic document types by one scalar metadata field.
- Patram keeps built-in `document` behavior implicitly and does not require
  repos to declare it in config.
- `fields` is the only user-authored metadata and relation model.
- Scalar fields use exact field names across config, markdown, YAML, and JSDoc.
- `ref` fields replace user-authored relation definitions.
- `ref` values resolve path targets through canonical document identities.
- `title` and `description` remain built-in metadata fields with fallback
  materialization and do not require explicit field declarations.
- Stored queries remain in `.patram.json` under `queries`.
- Patram does not provide backward compatibility for:
  - legacy config sections
  - parser-specific mapping vocabulary
  - title-case metadata aliases
  - hidden `[patram ...]` directive syntax

## Rationale

- Repo authors should learn document types and fields, not an internal
  claim-to-graph mapping language.
- One authored field name across config and source keeps onboarding direct and
  predictable.
- Path-backed and semantic document promotion are both needed, but they fit in
  one `types` model without exposing lower-level graph mechanics.
- `ref` fields preserve explicit graph edges without a separate relation schema.

## Consequences

- Config loading must reject legacy top-level keys directly.
- Graph materialization must derive metadata and edges from `types` and
  `fields`, not from repo-authored mappings.
- Query validation must derive relation names from `ref` fields plus built-in
  `links_to`.
- Repo docs, source anchors, fixtures, and tests must migrate to exact
  lower_snake_case metadata keys.
