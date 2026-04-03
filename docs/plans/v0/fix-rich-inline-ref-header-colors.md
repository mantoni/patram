# Fix Rich Inline Ref Header Colors Plan

- kind: plan
- status: active
- tracked_in: docs/roadmap/v0-dogfood.md
- decided_by: docs/decisions/rich-inline-ref-header-colors.md

## Goal

- Restore the shared green identity styling for inline resolved-link headers in
  `patram show` rich output after the inline-ref expansion change.

## Scope

- Add failing regression coverage for rich prose footnote and list annotation
  headers.
- Update rich inline resolved-link rendering so the `kind path` identity text
  stays green while markers and metadata punctuation keep their structural
  styling.
- Align the output conventions for inline resolved-link headers in rich mode.

## Order

1. Add failing regression tests for rich inline ref header styling.
2. Change the rich source renderer to style inline resolved-link identity
   headers with the shared green accent.
3. Update the documented rich-output conventions and finish validation.

## Acceptance

- `patram show` rich prose footnotes render the `kind path` identity text in
  green.
- `patram show` rich list annotations render the `kind path` identity text in
  green.
- Footnote markers, list markers, and metadata punctuation keep their gray
  structural styling.
- `plain` and `json` output stay unchanged.
- `npm run all` passes.
