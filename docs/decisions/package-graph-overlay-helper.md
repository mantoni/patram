# Package Graph Overlay Helper Proposal

- Kind: decision
- Status: accepted
- Tracked in: docs/plans/v0/package-graph-overlay-helper.md

- Expose `overlayGraph(base_graph, overlay)` from the `patram` package root.
- Accept overlay nodes as either an array of graph nodes or an id-keyed node
  record together with overlay edges and optional `document_node_ids`.
- Merge overlay node fields onto matching base nodes by id, append overlay edges
  after base edges, and preserve Patram document-path aliases in the resulting
  graph.
- Auto-derive `document_node_ids` entries from overlay nodes that carry
  canonical `$path` values so semantic document nodes remain addressable as
  `doc:<path>`.

## Rationale

- Package consumers need one supported way to compose transient nodes and edges
  onto a loaded graph without duplicating Patram's graph-shape rules.
- Shallow node overlays let local runtimes add fields to durable nodes without
  rebuilding the full node object.
- Preserving `document_node_ids` and hidden `doc:<path>` aliases keeps the
  resulting graph compatible with `queryGraph` and other Patram helpers that
  resolve document-backed nodes by path.
