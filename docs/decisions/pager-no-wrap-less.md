# Pager No-Wrap Less

- Kind: decision
- Status: accepted
- Tracked in: docs/plans/v0/pager-no-wrap-less.md

- Default pager behavior uses `less -FIRXS`.
- The `-S` flag is part of the default pager invocation so long rendered lines
  stay on one terminal row and can be inspected with horizontal scrolling.
- An explicit `PAGER` environment override keeps full control of pager flags.

## Rationale

- `show` output and wide query rows are easier to inspect when the pager does
  not wrap long lines.
- Adding `-S` changes only the default `less` behavior and does not change
  non-TTY output or explicit pager overrides.
