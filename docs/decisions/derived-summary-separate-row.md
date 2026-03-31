# Derived Summary Separate Row Proposal

- Kind: decision
- Status: accepted
- Tracked in: docs/plans/v0/derived-summary-separate-row.md

- Render stored node metadata and derived summary metadata separately.
- Keep stored node metadata inline on the title row in parenthesized `key=value`
  form.
- Render derived summary metadata on a separate indented row labeled `summary:`.
- Keep derived summary values in compact `key=value` form and preserve
  configured field order.
- Apply the same summary-row layout to `query`, `refs`, and `show` resolved
  links.
- In rich mode, render the `summary:` label in gray and keep derived field keys
  and values on the default foreground.
- In rich mode, keep inline metadata punctuation such as `(`, `)`, `=`, and `,`
  gray while leaving direct metadata keys and values on the default foreground.

## Rationale

- A separate summary row distinguishes stored node properties from output-time
  derived metadata.
- The `summary:` label clarifies that the second row is computed state rather
  than document-backed metadata.
- Keeping direct properties inline preserves fast scanning of node identity and
  intrinsic metadata.
- Limiting gray styling to structural punctuation and labels keeps computed
  state visible without making the output noisy.
