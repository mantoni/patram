# Rich Source Mermaid Blocks Proposal

- kind: decision
- status: accepted
- tracked_in: docs/plans/v0/rich-source-mermaid-blocks.md

- Render fenced markdown code blocks whose language is `mermaid` as ASCII
  diagrams in `patram show` rich output.
- Use the `beautiful-mermaid` package for Mermaid-to-ASCII rendering.
- Use a compact Mermaid ASCII layout with reduced inner box padding while
  leaving inter-node spacing at the package defaults.
- Keep Mermaid-owned ANSI coloring disabled so Patram's fenced-block surface
  remains the only color layer in rich output.
- Keep non-`mermaid` fenced code blocks on the existing Shiki and shaded-block
  rendering path.

## Rationale

- Mermaid diagrams are common in Patram docs and lose structure when shown as
  raw source in the terminal.
- Terminal rich output benefits from tighter node boxes, but overriding
  inter-node spacing can introduce layout issues inside Patram's fenced-block
  framing.
- Mermaid-owned ANSI colors conflict with Patram's shaded code-block surface and
  can make diagrams unreadable on dark terminals.
- Rich source rendering already allows block-specific formatting for markdown,
  so `mermaid` fences fit the existing renderer-owned rendering model.
- A dedicated Mermaid-to-ASCII renderer keeps `plain` output unchanged while
  making `rich` output meaningfully more readable in terminal sessions.
