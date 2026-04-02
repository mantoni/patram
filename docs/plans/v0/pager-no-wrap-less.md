# Pager No-Wrap Less

- kind: plan
- status: active
- tracked_in: docs/roadmap/v0-dogfood.md
- decided_by: docs/decisions/pager-no-wrap-less.md

## Goal

- Keep default pager output horizontally scrollable by passing `-S` to `less`.

## Scope

- Document the default pager flag change.
- Add a failing runtime test for the default `less` invocation.
- Update the default pager flags in the output writer.

## Order

1. Record the decision and plan.
2. Add a failing test for the default pager arguments.
3. Update the default pager invocation to include `-S`.
4. Run the required validation and create a commit.

## Acceptance

- The default pager invocation is `less -FIRXS`.
- A `PAGER` environment override still bypasses the default `less` flags.
- `npm run all` passes.
