# Check Target Resolution Proposal

- Kind: decision
- Status: accepted
- Tracked in: docs/plans/v0/fix-check-path-targets.md

- `patram check` accepts a project root, a subdirectory, or a file path.
- When `check` receives an explicit path, config discovery starts from that path
  and walks up ancestor directories until it finds `.patram.json`.
- `check` builds the graph for the discovered project root.
- `check` filters diagnostics and success counts to the requested file or
  directory target.

## Rationale

- File and subdirectory targets should work inside a repo without requiring a
  second config file.
- Building the full project graph preserves broken-link detection for links that
  point outside the requested subset.
- Filtering by origin path keeps targeted checks focused and predictable.
