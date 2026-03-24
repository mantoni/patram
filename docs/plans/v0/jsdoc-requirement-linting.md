# JSDoc Requirement Linting Plan

- Kind: plan
- Status: active
- Decided by: docs/decisions/jsdoc-requirement-linting.md

## Goal

- Stop warning on missing JSDoc blocks during `npm run check:lint`.
- Remove low-value generic JSDoc return annotations added to satisfy that rule.

## Scope

- Update `eslint.config.js` to disable `jsdoc/require-jsdoc`.
- Add a validation test that locks the ESLint rule state.
- Remove generic `@returns {object}` and `@returns {object[]}` tags from repo
  helpers where the return value is self-evident.

## Order

1. Document the linting decision.
2. Add a failing ESLint config test.
3. Disable the rule and clean the generic return annotations.
4. Run validation.

## Acceptance

- The JavaScript ESLint config disables `jsdoc/require-jsdoc`.
- `npm run check:lint` no longer emits the warning for missing JSDoc blocks.
- Generic `object` return annotations are removed from the repo files touched by
  the cleanup.
- `npm run all` passes.
