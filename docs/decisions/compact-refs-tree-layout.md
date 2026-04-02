# Compact Refs Tree Layout Proposal

- kind: decision
- status: accepted
- tracked_in: docs/plans/v0/compact-refs-tree-layout.md

- Keep `patram refs` relation grouping and JSON shape unchanged.
- Change `patram refs` plain and rich terminal output from nested blank-line
  blocks to a compact tree layout under each relation heading.
- Keep relation headings in the form `name (count)`.
- Prefix incoming entries with tree markers:
  - `├─` for non-final entries in a relation group
  - `└─` for the final entry in a relation group
- Render each incoming node header on the same line as its tree marker.
- Keep compact metadata labels inline on the header row.
- Render the incoming node title on one indented continuation line under the
  tree branch.
- Render descriptions, when present, as additional continuation lines under the
  same branch.
- Keep the inspected target node summary at the top of `refs` unchanged.
- Keep `plain` and `rich` on the same text layout.

## Rationale

- `refs` is usually scanned relation-by-relation, so reducing vertical padding
  makes larger incoming groups easier to inspect.
- Tree markers preserve grouping and item boundaries without repeating blank
  spacer lines.
- Keeping the target summary unchanged limits the behavioral change to incoming
  reference rendering.
