# Package Library Entrypoint Proposal

- Kind: decision
- Status: accepted
- Tracked in: docs/plans/v0/package-library-entrypoint.md

- Add a package root library entrypoint for `patram`.
- Expose the tagged fenced block extraction API from the package root.
- Keep the CLI `bin` entrypoint unchanged.
- Declare the package root entrypoint in `package.json`.
- Validate the published-package contract with metadata and consumer-install
  tests.

## Rationale

- Package consumers should be able to import `patram` directly instead of
  reaching into internal file paths.
- The tagged fenced block extractor is the first intended programmatic API, so
  the package root should expose it explicitly.
- Keeping the CLI bin separate preserves the existing command-line contract.
- Package-root smoke coverage prevents future publish regressions.
