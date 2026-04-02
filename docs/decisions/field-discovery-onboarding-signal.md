# Field Discovery Onboarding Signal Proposal

- kind: decision
- status: accepted
- tracked_in: docs/plans/v1/field-discovery-onboarding-signal.md

- `patram fields` should optimize for onboarding signal instead of exhaustive
  claim enumeration.
- Discovery should ignore repo root-level source files.
- Discovery should infer field suggestions only from document metadata zones:
  - top-of-file front matter
  - a contiguous top-of-body directive block after the title
- Discovery should stop scanning body directives for a document after the first
  non-directive body line.
- Discovery should normalize evidence values before type inference.
- Discovery should filter implausible field names using structural heuristics
  only.
- Discovery should remain config-independent for repos that have not adopted
  explicit schema yet.

## Rationale

- Repos often evaluate Patram before they have stable config.
- Onboarding works best when discovery surfaces likely document metadata rather
  than every directive-shaped label in prose.
- Repo root-level files are usually project instructions or support material,
  not graph-document metadata.
- Normalized evidence values improve type suggestions without changing authoring
  syntax.
- Structural field-name heuristics reduce sentence-like false positives without
  tying discovery to one language.

## Consequences

- Section-local labels such as planning headings or reference glossaries are no
  longer treated as discovery evidence.
- Hidden or visible directives outside the initial metadata zone do not
  contribute to field suggestions.
- Discovery confidence becomes more representative because type inference sees
  normalized values.
- Field-name filtering must stay based on shape constraints such as length or
  token count, not curated word lists.
