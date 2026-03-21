# Specify Queries Output

- Kind: task
- Status: done
- Tracked in: docs/plans/v0/output-contract-alignment.md
- Decided by: docs/decisions/queries-output.md

- Keep `queries` distinct from the entity-summary layout used by `query` and
  `show`.
- Define the canonical `patram queries` layout in
  `docs/conventions/cli-output-v0.md`.
- Render `queries` in two aligned columns and highlight parsed query terms in
  `rich` output.
- Remove or rewrite conflicting guidance in
  `docs/conventions/query-results-v0.md`.
- Keep one source of truth for `queries` output examples.
