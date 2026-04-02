# Types And Fields Config Plan

- kind: plan
- status: active
- tracked_in: docs/roadmap/field-model-redesign.md
- decided_by: docs/decisions/types-and-fields-config.md

## Goal

- Replace Patram's graph-schema authoring model with a simpler `types` and
  `fields` config.
- Remove parser-specific config vocabulary and source metadata aliases.
- Keep stored queries in `.patram.json`.
- Ship the redesign as a breaking change with no compatibility layer.

## Scope

- New config vocabulary:
  - `types`
  - `fields`
  - `queries`
- Type promotion by:
  - `in`
  - `defined_by`
- Ref-field edge materialization.
- Exact lower_snake_case source metadata across markdown, YAML, and JSDoc.
- Repo config and metadata migration.
- Query, check, fields, and help updates for the new vocabulary.

## Workstreams

### 1. Config Schema And Validation

- Replace repo config types and schema with `types` and `fields`.
- Reject legacy config sections directly.
- Validate `types.<name>.in`, `types.<name>.defined_by`, field target types, and
  field-to-type applicability.

### 2. Identity And Graph Materialization

- Resolve canonical document identities from `types`.
- Materialize scalar metadata by exact field-name match.
- Materialize `ref` edges by exact field-name match plus canonical path
  resolution.
- Keep built-in `links_to`, `title`, and `description` behavior.

### 3. Parsing And Source Authoring

- Parse exact lower_snake_case metadata keys from markdown, YAML, and JSDoc.
- Remove hidden markdown directive support.
- Remove parser-specific metadata aliases from docs and fixtures.

### 4. Querying, Discovery, And CLI

- Derive known traversal relations from `ref` fields plus built-in `links_to`.
- Keep Cypher labels, `id(n)`, and `path(n)` behavior aligned with promoted
  document identities.
- Update `patram fields` to describe the new config shape.

### 5. Repo Migration And Dogfooding

- Migrate `.patram.json` to `types` and `fields`.
- Migrate indexed docs and source anchors to exact lower_snake_case metadata.
- Update docs and integration tests.

## Order

1. Record the decision and plan docs.
2. Add failing tests for config loading, validation, graph identity,
   materialization, and query linting.
3. Implement config schema and validation changes.
4. Implement identity, graph, and parser changes.
5. Migrate repo config and authored metadata.
6. Update docs, help text, and discovery output.
7. Run full validation and dogfood the repo.

## Acceptance

- `.patram.json` supports only `include`, `types`, `fields`, and `queries`.
- Legacy config sections are rejected with direct diagnostics.
- Path-backed and semantic document types promote to stable semantic ids.
- `ref` fields emit edges and validate path targets through canonical document
  identities.
- Stored queries lint against declared fields and ref-field relations.
- Repo docs and source anchors use exact lower_snake_case metadata keys.
- `npm run all` passes.
