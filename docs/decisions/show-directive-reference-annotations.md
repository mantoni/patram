# Show Directive Reference Annotations

- kind: decision
- status: accepted
- tracked_in: docs/plans/v0/show-directive-reference-annotations.md

- Include path-like directive references in `patram show <file>` resolved-link
  resolution.
- Include directive references in `show --json` `resolved_links`.
- Resolve directive targets in `show` with the same canonical path rules used by
  graph materialization and `check`.
- Annotate markdown directive references inline with the same placement rules as
  other resolved links:
  - directive list items render one indented `->` summary block below the owning
    item
  - directive lines outside list items render one prose-style footnote block at
    the end of the current section
- Keep non-path directives out of `resolved_links`.

## Rationale

- `show` should expose the same resolved graph targets that `check` validates.
- Directive references are semantically equivalent to other path-backed graph
  edges and should not disappear from human-facing inspection or machine output.
- Reusing canonical target resolution avoids `show` disagreeing with repo-root
  directive targets such as `tracked_in: docs/roadmap/v0-dogfood.md`.
