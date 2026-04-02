# Document-Backed Semantic Ids Plan

- kind: plan
- status: active
- tracked_in: docs/roadmap/v0-dogfood.md
- decided_by: docs/decisions/document-backed-semantic-ids.md

## Goal

- Make structural `$class` and `$id` mappings canonical for document-backed
  entities without adding a second explicit entity layer.

## Scope

- Derive one canonical node identity for each source document path.
- Promote document-backed nodes to semantic ids when structural mappings define
  them.
- Re-anchor outgoing relations on the canonical promoted node.
- Resolve path-targeted references and `show` lookups through internal
  path-to-node aliases.
- Keep unclassified documents and plain `links_to` validation behavior working.

## Order

1. Add failing tests for promoted document identity, edge sources, path
   references, and show/check compatibility.
2. Resolve canonical node identity per document path during graph
   materialization.
3. Reuse that canonical identity for document-backed field mappings and emitted
   relations.
4. Add internal path alias lookup for validation and show surfaces that still
   start from a file path.
5. Update repo docs that still describe all documents as path-backed ids.

## Acceptance

- A document with no semantic structural mappings still materializes as
  `doc:<path>`.
- A document with `$class` only materializes as `<class>:<path>`.
- A document with `$class` and `$id` materializes as `<class>:<id>`.
- Relations declared in a promoted document originate from the promoted node.
- Path-based references to a promoted document resolve to the promoted node.
- `patram show <path>` and `links_to` validation continue to work for promoted
  documents.
