# Show Inline Link Resolution Plan

- kind: plan
- status: active
- tracked_in: docs/roadmap/v0-dogfood.md
- decided_by: docs/decisions/show-inline-link-resolution.md
- decided_by: docs/decisions/source-rendering.md

## Goal

- Replace `show`'s resolved-link footer section with inline list annotations and
  section-local prose footnotes while preserving original markdown links.

## Scope

- Update the `show-document` plain-source annotation step.
- Update the rich markdown renderer to place resolved-link annotations inline.
- Keep incoming-reference summaries and JSON resolved-link payloads unchanged.
- Add regression coverage for prose sections and list items with resolved links.

## Order

1. Record the inline-link decision and update the output conventions.
2. Add failing tests for prose footnotes, list annotations, and rich marker
   styling.
3. Update plain `show` source annotation and rich markdown rendering.
4. Run the required validation and commit the change.

## Acceptance

- Plain `patram show` preserves original markdown links and no longer appends a
  resolved-link footer section.
- List items render one indented `->` block per resolved link directly under the
  owning item.
- Prose links render stable footnote markers and section-local footnote blocks.
- `patram show --json` keeps the existing `resolved_links` payload.
- `npm run all` passes.
