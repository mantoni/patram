# Fix Rich Source Test Color Fixture

- Kind: plan
- Status: active
- Tracked in: docs/roadmap/v0-dogfood.md
- Decided by: docs/decisions/rich-source-test-color-fixture.md
- Decided by: docs/decisions/source-rendering-terminal-surfaces.md

## Goal

- Make ANSI-sensitive rich-source tests deterministic across environments.

## Scope

- Update `lib/render-rich-source.test.js` to use a fixed ANSI fixture for
  color-specific expectations.
- Keep the renderer unchanged.

## Order

1. Add the decision and implementation plan.
2. Update the rich-source test to use a fixed `Ansis(3)` helper.
3. Run the focused test, touched-file validation, and full validation.

## Acceptance

- `npx vitest run lib/render-rich-source.test.js` passes in the current
  environment.
- Color-sensitive assertions no longer depend on ambient color auto-detection.
- `npm run all` passes.
