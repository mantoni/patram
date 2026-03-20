# Show Output Proposal

- Kind: decision
- Status: accepted
- Tracked in: docs/roadmap/v0-dogfood.md

- Show prints source first.
- Show prints resolved summary second.
- Show uses the shared `plain`, `rich`, and `json` output modes in v0.
- Show renders resolved links as numbered summaries backed by resolved target
  metadata.

## Rationale

- Source-first output keeps the document readable before the resolved summary.
- Shared output modes keep `show` aligned with `check`, `query`, and `queries`.
- Numbered resolved-link summaries preserve readable prose while exposing graph
  metadata.
