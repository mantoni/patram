# Graph Materialization Proposal

- Kind: decision
- Status: accepted
- Tracked in: docs/roadmap/v0-dogfood.md

- Graph materialization consumes validated schema config plus parsed claims.
- Every claim materializes or updates its source `document` node.
- Directive mappings resolve as `<parser>.directive.<name>`.
- `target: path` resolves relative to the claiming document path.
- Path targets normalize to repo-relative `/`-separated paths.
- Emitted target nodes materialize when absent.
- Emitted edges always start from the source document node.
- Nodes are keyed by node id and edges keep claim order.

## Rationale

- This keeps parsers neutral and moves semantics into schema config.
- Relative path resolution matches markdown link behavior.
- Auto-created target nodes let edge mappings stand on their own in v0.
