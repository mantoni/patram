# CI Entrypoint Invocation

- kind: decision
- status: accepted
- tracked_in: docs/plans/v0/ci-entrypoint-invocation.md

- Repository npm scripts must invoke the CLI through `./bin/patram.js`.
- CI and release automation should keep calling the shared npm scripts instead
  of duplicating the entrypoint path in workflow files.

## Rationale

- The package bin name is not available as a shell command in every repository
  CI context.
- `./bin/patram.js` is executable in the repo and resolves the intended local
  CLI entrypoint directly.
- Keeping the path inside `package.json` fixes both the checks workflow and any
  other automation that reuses `npm run check:patram` or `npm run all`.
