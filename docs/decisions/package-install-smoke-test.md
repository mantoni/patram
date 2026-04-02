# Package Install Smoke Test Proposal

- kind: decision
- status: accepted
- tracked_in: docs/plans/v0/package-install-smoke-test.md

- Add a published-package smoke test that packs the repo, installs the tarball
  into a temporary consumer project, and imports the packaged CLI entrypoint.
- Use that smoke test to catch runtime imports that only exist in
  `devDependencies`.
- Keep the check behavior-focused instead of adding an explicit dependency
  classification checker.
- Defer the `eslint-plugin-import` extraneous-dependencies rule until it is
  compatible with the repo's ESLint `10` baseline.

## Rationale

- The failing case happens in a consumer install, not in the repo checkout with
  development dependencies present.
- A tarball install test validates the package exactly as npm consumers receive
  it.
- A runtime smoke test is narrower and less policy-heavy than a manifest
  allowlist for dependency placement.
- The lint rule is still useful, but it cannot be adopted yet on the current
  ESLint major version.
