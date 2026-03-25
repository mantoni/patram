# Package API Declaration Build Plan

- Kind: plan
- Status: active
- Tracked in: docs/roadmap/v0-dogfood.md
- Decided by: docs/decisions/package-api-declaration-build.md

## Goal

- Make the published `patram` package expose TypeScript declarations for its
  supported API without leaving generated files in the repo after packaging.

## Scope

- Add package metadata for the generated declaration entrypoint.
- Build declaration files as part of npm pack and publish.
- Remove generated declaration files after packaging completes.
- Extend packed-package coverage to verify both runtime import and TypeScript
  consumption.

## Order

1. Document the package declaration build decision.
2. Add failing package metadata and packed-package declaration coverage.
3. Implement package-time declaration emit and cleanup.
4. Run validation and keep the plan active with the task in a terminal status.

## Acceptance

- `npm pack` produces a tarball that includes declaration files for the public
  package API.
- TypeScript consumers can import `patram` from the packed tarball without
  manual type shims.
- Generated declaration files are removed from the repo after packaging
  completes.
- `npm run all` passes.
