# Show Self Summary Proposal

- kind: decision
- status: accepted
- tracked_in: docs/plans/v0/fix-show-self-summary.md

- `patram show <file>` does not render the shown node summary on the terminal
  surfaces.
- `patram show <file> --json` does not emit a top-level `document` object for
  the shown file.
- `patram refs <file>` remains the command that renders the inspected node
  summary before incoming references.

## Rationale

- `show` already renders the file content, so repeating the same node below the
  divider adds noise without new information.
- Keeping the self-summary on `refs` preserves the inspected-target context on
  the reverse-reference surface.
- Removing the extra `document` payload from `show --json` aligns machine output
  with the documented source-plus-links contract.
