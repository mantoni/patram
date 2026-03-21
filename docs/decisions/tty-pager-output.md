# TTY Pager Output Proposal

- Kind: decision
- Status: accepted
- Tracked in: docs/roadmap/v0-dogfood.md

- `patram show` sends command output through a pager when `stdout` is a TTY.
- `patram query` sends command output through a pager when `stdout` is a TTY.
- Default pager behavior uses `less -FIRX`.
- Pager mode applies to the shared rendered command output after diagnostics are
  handled.
- In pager mode, `patram query` does not apply the default `25` result limit.
- `patram query --limit <number>` still applies an explicit limit in pager mode.
- When `stdout` is not a TTY, keep direct stdout output and the existing default
  query limit.

## Rationale

- `show` and wide `query` results are easier to inspect in a pager than in a
  scrolling terminal buffer.
- Keeping pager routing at the final rendered output preserves the shared
  renderer contract.
- Removing the implicit query cap in pager mode keeps interactive exploration
  complete while preserving explicit pagination controls.
