# Rich Source Resolved Link Matching Proposal

- Kind: decision
- Status: accepted
- Tracked in: docs/plans/v0/fix-rich-source-resolved-link-matching.md

- Match rich markdown link references only for path-like markdown targets.
- Do not consume Patram resolved-link references for external URIs.
- Do not consume Patram resolved-link references for fragment-only markdown
  links.
- Keep unresolved markdown links visible as plain link text in rich output.

## Rationale

- `show-document` only records resolved-link summaries for Patram link claims,
  which exclude external URIs and fragment-only links.
- Rich source rendering must follow the same link scope or numbered summaries
  drift when a non-claim markdown link appears before a resolved doc link.
