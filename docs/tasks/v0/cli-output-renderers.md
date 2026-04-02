# Implement CLI Output Renderers

- kind: task
- status: done
- tracked_in: docs/roadmap/v0-dogfood.md
- decided_by: docs/decisions/cli-output-architecture.md
- decided_by: docs/decisions/cli-output-modes.md
- decided_by: docs/decisions/cli-formatting-libraries.md

- Add the shared output view model for command results.
- Implement `plain`, `rich`, and `json` renderers from that view model.
- Route `query` and `queries` through the shared renderer pipeline.
