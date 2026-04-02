# Rich Source Tables Plan

- kind: plan
- status: active
- tracked_in: docs/roadmap/v0-dogfood.md
- decided_by: docs/decisions/rich-source-tables.md
- decided_by: docs/decisions/source-rendering.md

## Goal

- Make markdown tables in `patram show` rich output render as sized box-drawing
  tables with color and alignment support.

## Scope

- Add failing rich-source tests for boxed table layout, column alignment, and
  rich-mode colors.
- Replace markdown-style table rows in the rich markdown renderer with
  box-drawing output.
- Size each column to the widest visible rendered cell content.
- Apply parsed `left`, `center`, and `right` table alignment metadata.
- Render borders gray and header cells red in rich color mode.
- Update the source-rendering convention to document the table behavior.

## Order

1. Add failing rich-source tests for boxed table rendering and colors.
2. Update rich markdown table rendering to measure visible cell width and build
   box-drawing borders.
3. Apply parsed column alignment and rich-mode table colors.
4. Update the source-rendering convention for rich markdown tables.
5. Run validation and commit the change.

## Acceptance

- `npx vitest run lib/output/rich-source/render.test.js` passes.
- Rich markdown tables render with box-drawing borders sized to the rendered
  content.
- Rich color mode renders gray borders and red header cells without changing
  copied plain text.
- Left, center, and right alignment markers affect the rendered table columns.
- `npm run all` passes.
