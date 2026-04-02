# Document-Backed Semantic Ids Proposal

- kind: decision
- status: accepted
- tracked_in: docs/plans/v0/document-backed-semantic-ids.md
- Supersedes: docs/decisions/non-document-semantic-ids.md

- Let one document-backed entity materialize as exactly one canonical graph
  node.
- Promote document-backed nodes from `doc:<path>` ids to semantic ids when
  structural mappings assign `$class` and optionally `$id`.
- Keep `$path` as the repo-relative source path for every promoted
  document-backed node.
- Emit outgoing relations from the canonical promoted node identity.
- Resolve path-based references through the canonical node for that document
  path.
- Keep unclassified documents path-backed as `doc:<path>`.
- Keep any path aliases internal so query and traversal results operate on the
  canonical node only.
- Keep `show` and link validation path-oriented by resolving document paths
  through the canonical node metadata.

## Rationale

- A document-backed contract, task, decision, or similar work item should not
  split between path identity and semantic identity.
- Stable semantic ids let document moves preserve graph topology.
- Internal path aliases preserve path-based authoring and validation without
  duplicating logical nodes in the query graph.
