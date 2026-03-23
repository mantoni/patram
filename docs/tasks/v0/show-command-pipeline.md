# Complete Show Command Pipeline

- Kind: task
- Status: done
- Tracked in: docs/plans/v0/show-command.md
- Decided by: docs/decisions/show-output.md
- Decided by: docs/decisions/cli-output-architecture.md
- Decided by: docs/decisions/cli-output-modes.md
- Decided by: docs/decisions/cli-argument-parser.md
- Decided by: docs/decisions/cli-formatting-libraries.md

- Route `show`, `query`, and `queries` through the shared output pipeline.
- Implement `patram show <file>` with source rendering and resolved link
  summaries.
