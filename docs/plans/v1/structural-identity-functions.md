# Structural Identity Functions Plan

- Kind: plan
- Status: active
- Tracked in: docs/roadmap/field-model-redesign.md
- Decided by: docs/decisions/structural-identity-functions.md

## Goal

- Replace structural `$` field mappings and structural query aliases with an
  explicit identity model based on class-local config, Cypher labels, and
  structural functions.
- Split structural identity from metadata in graph materialization, query
  semantics, CLI docs, and the package API.
- Migrate the repo directly to the new model without backward compatibility.

## Scope

- Add `classes.<name>.identity` as the repo-authored structural identity
  surface.
- Support class identity modes:
  - `document_path`
  - `claim_value`
- Remove structural mapping targets from `mappings.node.field`.
- Replace structural query aliases and structural `$...` fields with:
  - Cypher labels
  - `id(variable)`
  - `path(variable)`
- Add structural `ENDS WITH` support for `path(variable)`.
- Break the package graph node shape into:
  - `identity`
  - `metadata`
- Rename `document_node_ids` to `document_path_ids`.
- Replace package `parseWhereClause` exports with `parseQueryExpression`
  exports.
- Migrate repo config, stored queries, help text, and reference docs.
- Supersede the focused filename-field plan.

## Order

1. Record this implementation plan and superseded plan references.
2. Add failing tests for config identity rules, graph materialization, Cypher
   structural functions, package exports/types, and repo dogfooding.
3. Implement class-local identity config and canonical identity resolution
   before metadata mappings run.
4. Refactor graph nodes to split `identity` and `metadata` while preserving
   path-based alias lookup for `show`, `refs`, and validation.
5. Implement Cypher labels plus `id()` / `path()` parsing, validation, and
   execution, and reject removed structural alias syntax.
6. Migrate `.patram.json`, stored queries, package exports/types, help text, and
   reference docs to the new model.
7. Run targeted checks, full validation, and commit the change.

## Acceptance

- Config accepts `classes.<name>.identity` for `document_path` and
  `claim_value`.
- Structural mapping fields and structural filename queries are rejected.
- Metadata fields may use names such as `id`, `class`, `path`, and `filename`.
- Graph nodes expose `identity` and `metadata` instead of mixed structural
  top-level fields.
- Document-backed semantic ids derive from the class-relative path without file
  extension.
- Cypher uses labels, `id(variable)`, and `path(variable)` for structural
  access.
- `path(variable) STARTS WITH ...` and `path(variable) ENDS WITH ...` execute.
- Package exports and packed-package types match the new query API and node
  shape.
- Repo config, stored queries, and docs dogfood the new syntax.
- `npm run all` passes.
