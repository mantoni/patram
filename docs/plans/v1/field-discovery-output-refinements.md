# Field Discovery Output Refinements Plan

- kind: plan
- status: active
- tracked_in: docs/roadmap/field-model-redesign.md
- decided_by: docs/decisions/field-discovery-workflow.md
- decided_by: docs/decisions/field-discovery-output-refinements.md

## Goal

- Refine `patram fields` so discovery output focuses on undefined fields,
  follows TTY pager conventions, and keeps evidence sections compact.

## Scope

- Filter discovered suggestions against configured metadata field and relation
  definitions.
- Route `fields` command text output through the pager when `stdout` is a TTY.
- Limit plain and rich evidence rendering to 5 rows plus an overflow summary.
- Update tests and command docs for the refined behavior.

## Order

1. Add failing tests for config-aware filtering, pager routing, and evidence
   overflow rendering.
2. Update discovery, CLI, and text rendering code.
3. Refresh command docs and run repo validation.

## Acceptance

- Configured metadata fields and relations are excluded from `patram fields`
  output.
- TTY `patram fields` output uses pager routing.
- Plain and rich output show 5 evidence rows followed by an overflow summary.
- JSON output remains complete.
