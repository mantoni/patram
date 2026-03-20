# Dogfood Query Graph v0 Proposal

- Kind: decision
- Status: accepted
- Tracked in: docs/roadmap/v0-dogfood.md

- Dogfood query graph nodes stay keyed by document path.
- `Kind:` directives overwrite the source document node `kind`.
- `Status:` directives materialize onto the source document node `status`.
- Work-item relations materialize as document-to-document edges.
- Query results print document ids, query kind, and title.

## Rationale

- This keeps the v0 graph model small for dogfooding.
- Querying repo work items does not require a second shadow node per file.
- Document ids remain stable even when work-item metadata changes.
