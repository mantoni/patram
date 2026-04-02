# Implement CLI Argument Parser

- kind: task
- status: done
- tracked_in: docs/roadmap/v0-dogfood.md
- decided_by: docs/decisions/cli-argument-parser.md
- decided_by: docs/decisions/cli-output-modes.md

- Parse shared output flags before command execution.
- Validate command names, options, and positionals from one command schema.
- Return one parsed command result for `check`, `query`, `queries`, and `show`.
