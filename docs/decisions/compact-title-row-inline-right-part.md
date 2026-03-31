# Compact Title Row Inline Right-Part Proposal

- Kind: decision
- Status: accepted
- Tracked in: docs/plans/v0/compact-title-row-inline-right-part.md

- Keep the compact query-family body layout from
  `docs/decisions/compact-two-column-terminal-output.md`.
- Replace the aligned two-column title row with one inline title row:
  - render the left title as-is
  - when present, render the current right-title content immediately after it
    separated by two spaces
- Do not pad the left title to a shared width for `queries`, `query`, or `refs`.
- In TTY output, keep truncation limited to the right part.
- When truncating a bracketed right part such as `[status: active]`, use the
  Unicode ellipsis character `…` and retain the closing bracket when width
  allows.
- Outside TTY output, keep the title row untruncated.

## Rationale

- The aligned title row adds visual noise because the left title values are
  often path-heavy and irregular.
- Keeping the right part inline preserves the denser block layout while making
  the row read more naturally.
- Retaining the closing bracket keeps truncated metadata labels visually
  balanced and easier to parse.
