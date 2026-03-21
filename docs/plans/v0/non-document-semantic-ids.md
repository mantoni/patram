# Non-Document Semantic Ids Plan

- Kind: plan
- Status: active
- Tracked in: docs/roadmap/v0-dogfood.md
- Decided by: docs/decisions/non-document-semantic-ids.md

## Goal

- Move non-document taxonomy nodes from path-backed ids to stable semantic ids
  while keeping document nodes keyed by path.

## Scope

- Extend graph mappings so non-document nodes can derive an explicit semantic
  key from claim values.
- Keep canonical reference markdown files as `document` nodes.
- Add explicit `defines`-style links from canonical reference docs to the
  semantic command and term nodes.
- Resolve path-targeted command and term relations through the semantic entity
  defined by the referenced canonical document.
- Extend query filtering with direct `id` predicates so semantic ids are
  queryable without depending on defining document paths.
- Update query and show rendering so document identity and entity identity stay
  understandable together.
- Keep the current path-backed taxonomy model in place until the semantic-id
  path is implemented.

## Order

1. Extend the config schema to support explicit non-document keys in node
   mappings.
2. Add failing graph and output tests for semantic command and term ids.
3. Materialize canonical reference docs as documents that define semantic
   entities.
4. Resolve path-targeted command and term relations through the defining
   document.
5. Update query surfaces and examples to show both the defining document and the
   entity id.
6. Migrate the repo taxonomy from path-backed command and term ids to semantic
   ids.

## Acceptance

- `document` nodes keep repo-relative path ids.
- Canonical command docs define nodes like `command:query`.
- Canonical term docs define nodes like `term:claim`.
- Moving `docs/reference/commands/query.md` does not change the `command:query`
  id.
- Agents can query command and term nodes without depending on canonical doc
  paths.
