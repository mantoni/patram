# Package Metadata Proposal

- Kind: decision
- Status: accepted
- Tracked in: docs/plans/v0/package-metadata.md

- Add a `files` allowlist to the package manifest.
- Publish only the CLI runtime directories.
- Exclude tests and documentation from the published tarball.
- Set the repository URL and homepage to the GitHub repository.
- Declare Node.js `22` as the minimum supported runtime version.
- Publish under the MIT license and include a license file in the repo.

## Rationale

- Reduce published package size and avoid shipping development-only files.
- Make npm package metadata point back to the source repository.
- Communicate the supported runtime baseline to package consumers.
- Include a standard license declaration for npm and GitHub consumers.
