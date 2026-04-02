# Add Package Install Smoke Test

- kind: task
- status: done
- tracked_in: docs/plans/v0/package-install-smoke-test.md
- decided_by: docs/decisions/package-install-smoke-test.md

- Pack the repo and install the tarball in a consumer fixture.
- Verify both the published library and CLI entrypoints import correctly.
