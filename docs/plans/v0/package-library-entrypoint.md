# Package Library Entrypoint Plan

- Kind: plan
- Status: done
- Tracked in: docs/roadmap/v0-dogfood.md
- Decided by: docs/decisions/package-library-entrypoint.md

## Goal

- Make `import 'patram'` expose the tagged fenced block extraction API.

## Scope

- Add a package root module that re-exports the tagged fenced block API.
- Update `package.json` publish metadata for the package root entrypoint.
- Add package contract coverage for the root export metadata.
- Extend the packed-package smoke test to import the package root API.

## Order

1. Document the package library entrypoint decision.
2. Add failing tests for package root metadata and consumer import.
3. Add the package root entrypoint and publish metadata.
4. Run validation and mark the plan done.

## Acceptance

- `import { extractTaggedFencedBlocks } from 'patram'` works in a consumer
  project after installing the packed tarball.
- `package.json` declares a package root entrypoint for npm consumers.
- The CLI bin entrypoint remains `bin/patram.js`.
- `npm run all` passes.
