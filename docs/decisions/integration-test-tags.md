# Integration Test Tags Proposal

- kind: decision
- status: accepted
- tracked_in: docs/plans/v0/integration-test-tags.md

- Tag slower integration-style tests with Vitest 4.1 `integration` and `smoke`
  tags.
- Use Vitest tag definitions to apply longer timeouts to the tagged tests.
- Raise the shared slow-test threshold so moderate integration-style tests stop
  reading as slow during normal runs.
- Prefer file-level `@module-tag` pragmas when a whole file belongs to one
  slower profile.
- Use per-test `tags` options when only part of a file needs the slower profile.

## Rationale

- The default slow-test threshold is a good fit for unit-style tests and should
  stay reasonably strict for the repo as a whole.
- CLI, package, pager, and git workflow tests are slower because they exercise
  filesystem, child-process, and package-tool integration.
- Vitest 4.1 tag definitions can apply per-tag timeouts, but the config does not
  support per-tag slow-test thresholds.
- A higher shared slow-test threshold reduces noise from the tagged
  integration-style tests while still surfacing the very slow smoke checks.
- The package install smoke test currently runs in about `3.4s`, so the shared
  threshold should leave modest headroom above that runtime.
