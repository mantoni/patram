# Fix Repo Dogfood Check

- kind: task
- status: done
- tracked_in: docs/plans/v0/fix-repo-dogfood-check.md
- decided_by: docs/decisions/markdown-link-claim-scope.md
- Blocked by: docs/tasks/v0/align-check-output.md
- Blocked by: docs/tasks/v0/spec-queries-output.md

- Make `patram check` pass on this repo after the output contract is aligned.
- Stop example links in docs from surfacing as false broken-link diagnostics.
- Preserve real broken-link detection for repo markdown.
