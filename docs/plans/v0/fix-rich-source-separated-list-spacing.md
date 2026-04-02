# Fix Rich Source Separated List Spacing

- kind: plan
- status: active
- tracked_in: docs/roadmap/v0-dogfood.md
- decided_by: docs/decisions/rich-source-separated-list-spacing.md
- decided_by: docs/decisions/source-rendering.md

## Goal

- Preserve visible separation between blank-line-separated top-level markdown
  list groups in rich `patram show` output.

## Scope

- Add a regression test for top-level unordered lists separated by one blank
  line.
- Teach the rich markdown renderer to preserve top-level list-item gaps from the
  original source text.
- Keep `plain` and `json` output unchanged.

## Order

1. Add a failing regression test for blank-line-separated top-level lists.
2. Capture top-level list-item gap hints from the source markdown.
3. Apply those hints while rendering top-level rich markdown lists.
4. Run the required validation and commit the change.

## Acceptance

- Rich markdown rendering keeps a visible blank line between the reported list
  groups.
- Existing list wrapping and nested-list rendering stay intact.
- `npm run all` passes.
