# Package Test File Exclusion Proposal

- Kind: decision
- Status: accepted
- Tracked in: docs/plans/v0/package-test-file-exclusion.md

- Exclude test files from the published npm tarball.
- Exclude test helper files from the published npm tarball.
- Enforce the exclusion through the `package.json` `files` allowlist.
- Keep runtime JavaScript, runtime type declarations, and the CLI entrypoint in
  the tarball.

## Rationale

- Test files increase the package size without helping package consumers.
- Test helpers are development-only internals and should not be part of the
  public package payload.
- A single manifest allowlist keeps the packaging contract in one place.
- The published tarball should match the runtime surface of the CLI.
