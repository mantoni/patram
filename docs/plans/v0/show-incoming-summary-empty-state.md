# Show Incoming Summary Empty State

- kind: plan
- status: active
- tracked_in: docs/roadmap/v0-dogfood.md
- decided_by: docs/decisions/show-incoming-summary-empty-state.md
- decided_by: docs/decisions/reverse-reference-inspection.md

## Goal

- Hide the empty incoming-summary chrome in human-facing `patram show` output.

## Scope

- Add regression tests for `show` plain and rich output when `incoming_summary`
  is empty.
- Keep the existing incoming-summary block and hint for non-empty summaries.
- Keep `show` JSON output unchanged.
- Update the `show` command reference to describe the conditional summary.

## Order

1. Add failing renderer tests for empty incoming summaries in `show`.
2. Update the plain and rich `show` renderers to skip the empty incoming block
   and hint.
3. Update command docs and run the required validation.

## Acceptance

- `patram show <file>` plain output omits `incoming refs:` and the `refs` hint
  when there are no incoming relations.
- `patram show <file>` rich output omits the same empty-state chrome.
- Non-empty incoming summaries still render relation counts plus the `refs`
  hint.
- `patram show <file> --json` keeps the current `incoming_summary` field.
- `npm run all` passes.
