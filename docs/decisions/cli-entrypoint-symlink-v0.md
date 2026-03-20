# CLI Entrypoint Symlink v0 Proposal

- Kind: decision
- Status: accepted
- Tracked in: docs/roadmap/cli-entrypoint-symlink-v0.md

- The CLI entrypoint guard must treat symlinked executable paths as the same
  entrypoint as the real `bin/patram.js` file.
- Entrypoint detection compares canonical real paths, not the raw invocation
  path string.
- Linked and globally installed binaries must preserve the same exit codes and
  diagnostics as direct execution of `bin/patram.js`.

## Rationale

- `npm link` and global npm installs expose the CLI through symlinked executable
  paths.
- A raw path comparison can skip CLI startup even when the correct module was
  loaded.
- The packaged binary contract is part of the CLI surface and needs a test.
