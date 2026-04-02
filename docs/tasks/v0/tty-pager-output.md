# Implement TTY Pager Output

- kind: task
- status: done
- tracked_in: docs/plans/v0/tty-pager-output.md
- decided_by: docs/decisions/tty-pager-output.md

- Route TTY `show` and `query` output through the pager-backed output path.
- Remove the implicit default query cap only for pager-backed interactive runs.
