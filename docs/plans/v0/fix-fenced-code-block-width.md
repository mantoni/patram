# Fix Fenced Code Block Width

- kind: plan
- status: active
- tracked_in: docs/roadmap/v0-dogfood.md
- decided_by: docs/decisions/source-rendering-terminal-surfaces.md
- decided_by: docs/decisions/source-rendering.md

## Goal

- Keep fenced markdown code-block rows aligned to one shared visible width in
  rich `patram show` output.

## Scope

- Add a regression test for a fenced markdown block whose content reaches the
  measured row width.
- Include fenced-block content indentation in the shared row-width calculation.
- Leave direct source-file rendering unchanged.

## Order

1. Add a failing regression test for a wide fenced markdown block.
2. Update fenced code-block width measurement to account for content
   indentation.
3. Run the required validation and commit the fix.

## Acceptance

- Rich fenced markdown code blocks render label, content, and spacer rows at the
  same visible width.
- Direct source-file code blocks keep their current layout.
- `npm run all` passes.
