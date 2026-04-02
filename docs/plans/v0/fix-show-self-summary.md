# Fix Show Self Summary Plan

- kind: plan
- status: active
- tracked_in: docs/roadmap/v0-dogfood.md
- decided_by: docs/decisions/show-self-summary.md
- decided_by: docs/decisions/show-output.md
- decided_by: docs/decisions/reverse-reference-inspection.md

## Goal

- Stop `patram show <file>` from repeating the shown graph node after the
  rendered file content.

## Scope

- Add failing renderer and view-model tests that lock the no-self-summary
- contract for `show`.
- Remove the shown-document summary from the `show` output view and renderers.
- Keep `patram refs <file>` unchanged.

## Order

1. Add the failing `show` output regressions for plain, rich, and JSON output.
2. Remove the shown-document self-summary from the `show` output view.
3. Keep `refs` node summaries intact and run validation.

## Acceptance

- `patram show <file>` renders source, resolved links, and the incoming summary
  without rendering the shown node summary.
- `patram refs <file>` still renders the inspected node summary before incoming
  references.
- `patram show <file> --json` omits the shown-file `document` payload.
- `npm run all` passes.
