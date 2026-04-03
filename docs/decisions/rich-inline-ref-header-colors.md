# Rich Inline Ref Header Colors Proposal

- kind: decision
- status: accepted
- tracked_in: docs/plans/v0/fix-rich-inline-ref-header-colors.md

- Keep inline resolved-link identity headers on the shared green accent in
  `show` rich output.
- Apply the green accent to the `kind path` portion of prose footnote headers
  such as `[^1] document docs/guide.md`.
- Apply the green accent to the `kind path` portion of list annotation headers
  such as `-> document docs/guide.md`.
- Keep prose footnote markers such as `[^1]`, list markers such as `->`, and
  metadata punctuation on their existing gray structural styling.
- Narrow the `show` rich-output color policy from
  `docs/decisions/rich-output-colors.md` for inline resolved-link headers only.

## Rationale

- Inline resolved-link headers represent the same document identity row that
  already uses green in the rest of Patram rich output.
- Keeping only the marker tokens gray preserves the structural hierarchy while
  restoring the shared accent for the referenced node identity.
- Matching plain layout and existing color roles limits the fix to styling
  without reopening the inline-link rendering design.
