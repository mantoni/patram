# Compact Metadata Label Parentheses Plan

- kind: plan
- status: active
- tracked_in: docs/roadmap/v0-dogfood.md
- decided_by: docs/decisions/compact-metadata-label-parentheses.md

## Goal

- Change compact metadata labels in `patram query` and `patram refs` from
  bracketed `key: value` rows to parenthesized `key=value` pairs.

## Scope

- Add regression coverage for compact metadata labels and TTY truncation.
- Update the shared compact metadata-label helper used by plain and rich query
  output.
- Align the CLI output convention text with the new label shape.

## Order

1. Add failing tests for parenthesized compact metadata labels.
2. Update the shared compact metadata formatter and truncation helper.
3. Refresh the CLI output convention and run the required validation.

## Acceptance

- `patram query` and `patram refs` render inline metadata as
  `(key=value, key=value)`.
- TTY truncation still affects only the inline metadata label and retains the
  closing `)` when width allows.
- `show` output stays unchanged.
- `npm run all` passes.
