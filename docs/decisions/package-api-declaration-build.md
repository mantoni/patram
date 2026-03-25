# Package API Declaration Build Proposal

- Kind: decision
- Status: accepted
- Tracked in: docs/plans/v0/package-api-declaration-build.md

- Build declaration files for the published `patram` package API during npm
  packaging.
- Expose the generated package-root declaration entrypoint through package
  metadata.
- Include the generated declaration files in the packed tarball.
- Remove the generated declaration files after packaging completes.

## Rationale

- TypeScript consumers should get types for the supported package API without
  importing private source files or enabling custom JavaScript analysis.
- Building declarations only during packaging keeps the working tree free of
  generated artifacts.
- Cleaning the generated declaration files after pack or publish avoids
  accidental commits and keeps normal development flows unchanged.
