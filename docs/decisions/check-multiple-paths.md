# Check Multiple Paths

- Kind: decision
- Status: accepted
- Tracked in: docs/plans/v0/check-multiple-paths.md
- Decided by: docs/decisions/cli-argument-parser.md
- Decided by: docs/decisions/cli-help-copy-v0.md

- Make `patram check` accept zero or more path arguments.
- Treat multiple paths as one scoped check run within the same project root.
- Combine selected files and diagnostics across the requested paths.
- Deduplicate overlapping files and diagnostics when one path contains another.
- Fail with a command error when the requested paths resolve to different
  project roots.

## Rationale

- Checking several docs or directories at once is a common workflow during
  focused edits.
- One unioned run keeps output and success summaries aligned with the existing
  `check` contract instead of printing one report per path.
- Deduping overlapping scopes preserves stable counts for combinations like
  `patram check docs docs/tasks/example.md`.
- Restricting one invocation to one project root keeps repo-relative diagnostic
  paths unambiguous.
