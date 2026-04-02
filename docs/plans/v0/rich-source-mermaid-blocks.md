# Rich Source Mermaid Blocks Plan

- kind: plan
- status: active
- tracked_in: docs/roadmap/v0-dogfood.md
- decided_by: docs/decisions/rich-source-mermaid-blocks.md
- decided_by: docs/decisions/source-rendering.md

## Goal

- Make fenced `mermaid` blocks render as ASCII graphs in `patram show` rich
  output.

## Scope

- Add a failing rich-source renderer test for a markdown `mermaid` fence.
- Render `mermaid` fences through `beautiful-mermaid`.
- Use reduced Mermaid box padding, keep default inter-node spacing, and disable
  Mermaid-owned ANSI coloring.
- Keep existing fenced-code rendering for every other fence language.
- Update source-rendering conventions to document the new rich behavior.

## Order

1. Add a failing renderer test for a markdown `mermaid` fence in rich output.
2. Integrate `beautiful-mermaid` into fenced markdown code-block rendering.
3. Tighten Mermaid box padding, keep default Mermaid outer spacing, and keep
   Mermaid ANSI coloring disabled.
4. Update the source-rendering convention for `mermaid` fences.
5. Run validation and commit the change.

## Acceptance

- `npx vitest run lib/render-rich-source.test.js` passes.
- Rich output renders fenced `mermaid` blocks with compact node boxes and
  default inter-node spacing.
- Rich color mode does not add Mermaid-owned ANSI colors inside the diagram.
- Non-`mermaid` fenced code blocks keep their current rich rendering.
- `npm run all` passes.
