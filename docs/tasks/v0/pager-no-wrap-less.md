# Add No-Wrap Less Pager Default

- kind: task
- status: done
- tracked_in: docs/plans/v0/pager-no-wrap-less.md
- decided_by: docs/decisions/pager-no-wrap-less.md

- Change the default `less` invocation to `less -FIRXS`.
- Preserve explicit `PAGER` overrides without injecting default flags.
