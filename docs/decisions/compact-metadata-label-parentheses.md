# Compact Metadata Label Parentheses Proposal

- kind: decision
- status: accepted
- tracked_in: docs/plans/v0/compact-metadata-label-parentheses.md

- Keep compact query-family title rows on one line with inline metadata.
- Replace bracketed metadata labels such as `[kind: parse  status: active]` with
  parenthesized key-value labels such as `(kind=parse, status=active)`.
- Render each visible metadata field as `key=value` inside the compact label.
- Separate adjacent compact-label fields with `, `.
- Keep `plain` and `rich` on the same text layout.
- In TTY output, keep truncation limited to the metadata label and retain the
  closing `)` when width allows.
- Keep `show` resolved-link metadata rows unchanged.

## Rationale

- `key=value` is denser than `key: value` in the inline title row.
- Parentheses distinguish compact query-family metadata from the multi-line
  metadata rows used in `show` resolved links.
- Comma separation improves scanability when several metadata fields collapse
  into one inline label.
