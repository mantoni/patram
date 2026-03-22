# CLI Help And Errors Plan

- Kind: plan
- Status: active
- Tracked in: docs/roadmap/v0-dogfood.md
- Decided by: docs/decisions/cli-argument-parser.md
- Decided by: docs/decisions/cli-help-entrypoints.md
- Decided by: docs/decisions/cli-help-copy-v0.md

## Goal

- Make the CLI self-describing from the terminal.
- Add consistent help entrypoints for the root command and every command.
- Replace generic parse failures with task-oriented usage and suggestion output.

## Scope

- Add `patram help`, `patram --help`, and `patram <command> --help`.
- Add per-command usage, summary, examples, and related-command hints.
- Improve unknown-command, unknown-option, and missing-argument diagnostics.
- Keep CLI parsing and help rendering in repo-local code.
- Keep existing command semantics unchanged outside the new help paths.

## Order

1. Record a help-surface decision that defines entrypoints, exit codes, and the
   minimum help content for root and command views.
2. Update the canonical CLI output convention with root-help, command-help, and
   error examples.
3. Add failing parser and CLI tests for root help, command help, unknown
   commands, unknown options, and missing required arguments.
4. Implement help rendering and suggestion-oriented parse diagnostics.
5. Refactor command metadata so help text and validation stay aligned.
6. Run validation.

## Acceptance

- `patram` prints a root usage summary and exits successfully.
- `patram --help` and `patram help` produce the same root help output.
- `patram query --help` prints query-specific usage, options, and examples.
- `patram help query` prints the same command help as `patram query --help`.
- Unknown commands and unknown options report the invalid token and a next step.
- Missing required arguments report command usage instead of a generic parse
  failure.
- `npm run all` passes.
