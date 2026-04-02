# Fix Rich Source Ordered List Marker Alignment

- kind: plan
- status: active
- tracked_in: docs/roadmap/v0-dogfood.md
- decided_by: docs/decisions/rich-source-ordered-list-marker-alignment.md
- decided_by: docs/decisions/source-rendering.md

## Goal

- Keep ordered-list marker periods aligned in rich `patram show` output when a
  markdown list contains ten or more items.

## Scope

- Update the rich source-rendering convention for ordered-list markers.
- Add a regression test for a double-digit ordered list.
- Adjust only the rich markdown list renderer and keep other output modes
  unchanged.

## Order

1. Record the ordered-list alignment decision and convention update.
2. Add a failing regression test for a list that crosses from `9.` to `10.`
3. Adjust ordered-list prefix sizing in the rich markdown renderer.
4. Run the required validation and commit the change.

## Acceptance

- Rich markdown output left-pads single-digit ordered-list numbers when the same
  list reaches double digits.
- The marker period and wrapped text column stay aligned across all items in the
  list.
- Unordered lists and nested list indentation remain intact.
- `npm run all` passes.
