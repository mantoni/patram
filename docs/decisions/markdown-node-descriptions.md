# Markdown Node Descriptions Proposal

- Kind: decision
- Status: accepted
- Tracked in: docs/plans/v0/markdown-node-descriptions.md

- Extend markdown parsing to emit `document.description` claims from prose.
- Reuse the JSDoc prose heuristic for long first paragraphs:
  - the title source may split at the first sentence boundary when the first
    paragraph is longer than `120` characters
  - the remaining prose from that paragraph becomes part of the description
- For markdown documents with a heading title:
  - a paragraph directly after the title becomes the description
  - a contiguous top-of-body block of pure directives may appear between the
    title and that paragraph without blocking description extraction
  - if a list, fenced block, quote, table, or another heading appears before the
    first eligible paragraph, emit no description
- For markdown documents without a heading title:
  - keep the existing title rule: the first non-front-matter line remains the
    parser-derived title source
  - the opening paragraph becomes the description source
  - if the first block is not a paragraph, emit no description
- Parser-derived markdown descriptions attach to the backing document node.
- Promoted semantic nodes inherit the backing document description when they
  share the same canonical path and do not already carry an explicit
  description.
- Explicit metadata wins over parser-derived description when both map to the
  same node field.

## Rationale

- Markdown should expose the same semantic description handle as JSDoc-backed
  source anchors.
- Allowing a pure directive block after the heading matches the repo's existing
  authoring style for reference docs and worktracking docs.
- Promoted semantic nodes such as taxonomy entries need prose descriptions even
  when their titles come from directive-driven mappings.
- Giving explicit metadata precedence preserves intentional authored values and
  avoids surprising overrides from heuristic extraction.
