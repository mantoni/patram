# Implement TTY Pager Output

- Kind: task
- Status: done
- Tracked in: docs/plans/v0/tty-pager-output.md
- Decided by: docs/decisions/tty-pager-output.md

- Route TTY `show` and `query` output through the pager-backed output path.
- Remove the implicit default query cap only for pager-backed interactive runs.
