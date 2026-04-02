# Markdown Link Claim Scope Proposal

- kind: decision
- status: accepted
- tracked_in: docs/plans/v0/fix-repo-dogfood-check.md

- Parse `markdown.link` claims only from markdown prose, not from fenced code
  blocks.
- Materialize `markdown.link` claims only for path-like targets.
- Ignore markdown links whose targets are external URIs.
- Ignore markdown links whose targets are document fragments.

## Rationale

- Fenced examples document CLI behavior and should not create live graph edges.
- `check` should validate repo document links, not external documentation sites.
- Skipping fragment-only targets keeps document-link validation focused on file
  existence.
