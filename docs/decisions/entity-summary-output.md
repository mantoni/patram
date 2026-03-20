# Entity Summary Output Proposal

- Kind: decision
- Status: accepted
- Tracked in: docs/plans/v0/output-contract-alignment.md

- Render `query` results as expandable entity-summary blocks.
- Render resolved-link footnotes in `show` with the same entity-summary shape.
- Start each v0 entity-summary header with `document <path>`.
- Prefix `show` footnote headers with the stable reference number such as `[1]`.
- Render metadata immediately under the header on one row when present.
- Leave one blank line before the indented title and optional description.
- Keep descriptions optional so the layout works before description extraction
  exists.

## Rationale

- Identity-first headers scale better than title-first search results as the
  graph grows beyond markdown docs.
- One reusable block shape keeps `query` and `show` visually aligned.
- Immediate metadata keeps the structural facts close to the path they qualify.
- Indented content leaves room for longer summaries without changing the block
  contract.
