# Package Test File Exclusion Plan

- kind: plan
- status: active

## Goal

- Stop shipping tests and test helpers in the npm tarball.

## Scope

- Add a package contract test for the packed file list.
- Update the `package.json` `files` allowlist for `bin/` and `lib/`.

## Order

1. Document the packaging decision.
2. Add a failing test for the packed file list.
3. Exclude test artifacts from the package contents.
4. Run validation.

## Acceptance

- `npm pack --dry-run --json --ignore-scripts` excludes `*.test.js`.
- `npm pack --dry-run --json --ignore-scripts` excludes `*.test-helpers.js`.
- The runtime CLI entrypoint and runtime library files remain in the tarball.
- `npm run all` passes.
