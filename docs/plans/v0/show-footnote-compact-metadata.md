# Show Footnote Compact Metadata Plan

- Kind: plan
- Status: active
- Tracked in: docs/roadmap/v0-dogfood.md
- Decided by: docs/decisions/show-footnote-compact-metadata.md

## Goal

- Make `patram show` footnote headers use the same compact metadata formatting
  and truncation behavior as `patram query` and `patram refs`.

## Scope

- Add renderer coverage for compact footnote metadata and TTY truncation.
- Update the `show` plain and rich renderers to reuse the compact title-row
  layout for footnotes.
- Keep the existing footnote content indentation and JSON output unchanged.
- Refresh the CLI output convention text.

## Order

1. Add failing tests for compact `show` footnote metadata and TTY truncation.
2. Update the `show` footnote renderers to use the shared compact layout.
3. Refresh the CLI output convention and run the required validation.

## Acceptance

- `patram show` footnotes render inline metadata as `(key=value, key=value)`.
- TTY truncation affects only the inline footnote metadata label.
- The footnote title and description remain indented under the header row.
- `npm run all` passes.
