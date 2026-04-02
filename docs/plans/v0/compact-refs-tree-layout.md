# Compact Refs Tree Layout Plan

- kind: plan
- status: active
- tracked_in: docs/roadmap/v0-dogfood.md
- decided_by: docs/decisions/compact-refs-tree-layout.md

## Goal

- Make `patram refs` incoming-reference output denser by rendering relation
  groups as compact tree blocks instead of blank-line-separated node blocks.

## Scope

- Add regression coverage for the new `refs` tree layout in the shared incoming
  reference helper and in plain/rich renderer output.
- Update the shared incoming-reference layout helper used by `refs`.
- Refresh `refs` command documentation and keep JSON output unchanged.

## Order

1. Add failing layout and renderer tests for tree markers and continuation
   indentation.
2. Update the incoming-reference layout helper and rich styling to match the new
   compact tree layout.
3. Refresh command docs and run the required validation.

## Acceptance

- `patram refs` relation headings still render as `name (count)`.
- Incoming relation items render as tree rows with inline metadata labels.
- Incoming titles and descriptions render as continuation lines aligned under
  their tree branch.
- The inspected target node summary and JSON output stay unchanged.
- `npm run all` passes.
