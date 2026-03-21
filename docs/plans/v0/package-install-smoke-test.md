# Package Install Smoke Test Plan

- Kind: plan
- Status: active

## Goal

- Catch published-package runtime dependency mistakes during normal validation.
- Fix the current `string-width` runtime dependency placement.

## Scope

- Add a package smoke test that runs `npm pack`, installs the tarball into a
  temporary consumer project, and imports the packaged CLI.
- Move `string-width` from `devDependencies` to `dependencies`.
- Record the deferred ESLint dependency-lint follow-up in the decision only.

## Order

1. Document the decision for package-install smoke testing.
2. Add a failing smoke test for the published package.
3. Move `string-width` into runtime dependencies.
4. Run validation.

## Acceptance

- Repo validation fails if the packed package cannot be installed and imported
  as a consumer dependency.
- `string-width` is declared in `dependencies`.
- `npm run all` passes.
