# CLI Entrypoint Symlink Plan

- Kind: plan
- Status: active

## Goal

- Make the published and linked `patram` binary execute the CLI logic.

## Scope

- Add a symlinked executable contract test for the CLI entrypoint.
- Resolve entrypoint detection through canonical file paths.
- Keep command behavior unchanged outside the entrypoint guard.

## Order

1. Document the symlinked entrypoint decision.
2. Add a failing CLI contract test that invokes a symlinked executable path.
3. Update `bin/patram.js` to compare canonical paths.
4. Run validation.

## Acceptance

- Invoking a symlink to `bin/patram.js` runs the CLI.
- A symlinked invalid command prints `Unknown command.` to standard error.
- A symlinked invalid command exits `1`.
- `npm run all` passes.
