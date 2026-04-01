# Wrapped List-Item Directive Continuations Proposal

- Kind: decision
- Status: accepted
- Tracked in: docs/plans/v0/fix-wrapped-list-item-directive-continuations.md

- Treat indented continuation lines under a markdown list-item directive as part
  of that directive value.
- Join wrapped list-item directive lines with single spaces in the emitted
  directive claim value.
- Keep wrapped list-item directive continuation lines inside the top-of-body
  directive block so markdown description extraction does not treat them as
  prose.

## Rationale

- Command reference docs already wrap long `- Command Summary: ...` directives
  onto continuation lines.
- Keeping wrapped lines on the directive claim preserves the authored metadata
  and prevents the continuation tail from becoming a stray document description.
- Limiting continuation support to list-item directives fixes the authored repo
  pattern without broadening plain visible-line directive parsing.
