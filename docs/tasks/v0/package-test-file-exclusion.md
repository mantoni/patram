# Exclude Test Files From The Package

- kind: task
- status: done
- tracked_in: docs/plans/v0/package-test-file-exclusion.md
- decided_by: docs/decisions/package-test-file-exclusion.md

- Exclude `*.test.js` and `*.test-helpers.js` files from the packed tarball.
- Keep the publish allowlist aligned with the documented package boundary.
