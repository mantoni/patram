# Implement CLI Output Renderers

- Kind: task
- Status: done
- Tracked in: docs/roadmap/v0-dogfood.md
- Decided by: docs/decisions/cli-output-architecture.md
- Decided by: docs/decisions/cli-output-modes.md
- Decided by: docs/decisions/cli-formatting-libraries.md

- Add the shared output view model for command results.
- Implement `plain`, `rich`, and `json` renderers from that view model.
- Route `query` and `queries` through the shared renderer pipeline.
