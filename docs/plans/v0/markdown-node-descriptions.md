# Markdown Node Descriptions Plan

- Kind: plan
- Status: done
- Tracked in: docs/roadmap/v0-dogfood.md
- Decided by: docs/decisions/markdown-node-descriptions.md

## Goal

- Add markdown-derived node descriptions and render them consistently for
  document and promoted semantic nodes.

## Scope

- Emit `document.description` claims from markdown prose.
- Allow a contiguous pure directive block between a heading title and the
  descriptive paragraph.
- Preserve the existing markdown title heuristic while also emitting a
  meaningful description for non-heading markdown documents.
- Carry description values through graph materialization onto backing document
  nodes and inheriting promoted nodes, with explicit metadata precedence.
- Surface node descriptions in query, refs, and resolved-link output blocks.

## Order

1. Add failing parser tests for heading and non-heading markdown description
   extraction, including directive-block and blocked-by-list cases.
2. Add failing graph and output tests that lock description propagation to
   promoted nodes and explicit-metadata precedence.
3. Add failing renderer tests for optional description paragraphs in plain and
   rich entity summaries.
4. Implement markdown prose parsing for `document.description`.
5. Implement description precedence in graph materialization.
6. Extend output view models and renderers to show optional description
   paragraphs.
7. Run validation and mark the plan done after implementation lands.

## Acceptance

- Markdown files can emit `document.description` claims with exact origins.
- A paragraph after a heading title becomes the description even when a pure
  directive block sits between the title and that paragraph.
- A list, fenced block, quote, table, or heading before the first eligible
  paragraph suppresses markdown description extraction.
- A non-heading markdown file can still emit a meaningful description from its
  opening paragraph.
- Promoted semantic nodes such as `term:*` can carry markdown-derived
  descriptions.
- Explicit metadata continues to win over parser-derived description when both
  target the same field.
- Query, refs, and show resolved-link output render indented description
  paragraphs only when present.
- `npm run all` passes.
