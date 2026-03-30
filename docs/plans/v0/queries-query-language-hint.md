# Queries Query-Language Hint Plan

- Kind: plan
- Status: active
- Tracked in: docs/roadmap/v0-dogfood.md
- Decided by: docs/decisions/query-help-contract.md
- Decided by: docs/decisions/cli-help-copy-v0.md

## Goal

- Point `patram queries` users at the authoritative query-language help topic
  from the command output itself.

## Scope

- Add a query-language hint to `patram queries` plain and rich output.
- Keep the hint formatting aligned with existing CLI hint lines.
- Update the documented output contract and regression tests.

## Order

1. Add a failing `queries` output regression test.
2. Update the canonical `queries` output convention.
3. Implement the new hint through the shared output view.
4. Run validation.

## Acceptance

- `patram queries` ends with `Hint: patram help query-language` in plain output.
- Rich output preserves the same layout and styles the hint like other hints.
- `npx vitest run bin/patram.test.js lib/output/render-output-view-stored-queries.test.js`
  passes.
