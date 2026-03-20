# Test Layout v0 Roadmap

- Kind: roadmap
- Status: active

## Goal

- Separate repo-level tests from `lib/` implementation tests.
- Standardize tests on flat `it(...)` blocks.

## Scope

- Add a `test/` directory for repo-level checks.
- Move repo configuration and workflow contract tests into `test/`.
- Remove `describe(...)` wrappers from the moved tests.
- Add a focused test that prevents these repo-level tests from returning to
  `lib/`.

## Order

1. Document the decision.
2. Add a failing layout test.
3. Move the repo-level tests into `test/`.
4. Run validation.

## Acceptance

- `test/` contains the repo-level contract tests.
- `lib/` no longer contains the moved repo-level tests.
- No test file in the repo uses `describe(...)`.
