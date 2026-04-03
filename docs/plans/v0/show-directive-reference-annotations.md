# Show Directive Reference Annotations Plan

- kind: plan
- status: active
- tracked_in: docs/roadmap/v0-dogfood.md
- decided_by: docs/decisions/show-directive-reference-annotations.md
- decided_by: docs/decisions/show-inline-link-resolution.md

## Goal

- Make `show` annotate path-like directive references and emit them through the
  existing `resolved_links` JSON payload.

## Scope

- Extend `show-document` resolved-link collection to include directive claims
  that resolve to document-backed targets.
- Reuse canonical directive path resolution for repo-relative and promoted
  document targets.
- Annotate markdown directive references in plain and rich `show` output.
- Add regression coverage for directive footnotes, directive list-item
  annotations, and `show --json`.

## Order

1. Record the directive-annotation decision and update output conventions.
2. Add failing tests for markdown directive rendering and JSON resolved links.
3. Update `show` target resolution and output-model plumbing.
4. Run the required validation and commit the change.

## Acceptance

- `patram show docs/decisions/check-command.md` annotates `tracked_in` inline.
- `patram show --json <path>` includes directive references in `resolved_links`.
- Repo-root directive targets resolve to the same canonical document paths as
  `patram check`.
- `npm run all` passes.
