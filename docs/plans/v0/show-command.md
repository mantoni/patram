# Show Command Plan

- Kind: plan
- Status: active
- Tracked in: docs/roadmap/v0-dogfood.md
- Decided by: docs/decisions/show-output.md
- Decided by: docs/decisions/cli-output-architecture.md
- Decided by: docs/decisions/cli-output-modes.md
- Decided by: docs/decisions/cli-argument-parser.md
- Decided by: docs/decisions/cli-formatting-libraries.md

## Goal

- Unblock and implement `patram show <file>` on the shared CLI output pipeline.
- Keep `check`, `query`, and `queries` aligned with the documented v0 output
  contract.

## Scope

- Replace ad hoc argv parsing in `bin/patram.js`.
- Add shared output mode resolution and renderers.
- Implement `show` source rendering and resolved link summaries.
- Keep diagnostics on `stderr`.

## Order

1. Add failing parser tests for shared output flags and command positionals.
2. Implement the `parseArgs`-based CLI parser and integrate it in
   `bin/patram.js`.
3. Add failing renderer tests for `plain`, `rich`, and `json` output across
   `query`, `queries`, and `show`.
4. Implement the shared output view model and renderers.
5. Add failing `show` command tests for source rendering, resolved links, and
   missing files.
6. Implement `show`.
7. Refactor duplicated formatter code if needed.
8. Run validation.

## Acceptance

- `patram show docs/patram.md` renders source and resolved links.
- `patram show docs/patram.md --plain` works.
- `patram show docs/patram.md --json` works.
- `patram query` and `patram queries` render through the shared output pipeline.
- Diagnostics still go to `stderr`.
- `npm run all` passes.
