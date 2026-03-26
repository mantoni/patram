# Show Incoming Summary Empty State Proposal

- Kind: decision
- Status: accepted
- Tracked in: docs/plans/v0/show-incoming-summary-empty-state.md

- `patram show <file>` omits the `incoming refs:` summary block when the shown
  node has no incoming graph relations.
- `patram show <file>` omits the `patram refs <file>` hint when that incoming
  summary block is omitted.
- `patram show <file>` keeps the existing relation-count summary and `refs` hint
  when one or more incoming relations exist.
- `patram show <file> --json` keeps the existing `incoming_summary` field so
  machine-readable output stays stable.

## Rationale

- The empty `incoming refs:` block currently adds noise without surfacing any
  actionable graph information.
- The `refs` hint only helps when there is at least one incoming relation to
  inspect further.
- Keeping the JSON shape unchanged limits the fix to the human-facing empty
  state and avoids an unnecessary output-contract change.
