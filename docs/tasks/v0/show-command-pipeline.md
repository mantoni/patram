# Complete Show Command Pipeline

- kind: task
- status: done
- tracked_in: docs/plans/v0/show-command.md
- decided_by: docs/decisions/show-output.md
- decided_by: docs/decisions/cli-output-architecture.md
- decided_by: docs/decisions/cli-output-modes.md
- decided_by: docs/decisions/cli-argument-parser.md
- decided_by: docs/decisions/cli-formatting-libraries.md

- Route `show`, `query`, and `queries` through the shared output pipeline.
- Implement `patram show <file>` with source rendering and resolved link
  summaries.
