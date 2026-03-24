# JSDoc Requirement Linting Proposal

- Kind: decision
- Status: accepted
- Tracked in: docs/plans/v0/jsdoc-requirement-linting.md

- Disable the ESLint rule `jsdoc/require-jsdoc`.
- Keep JSDoc expectations in `AGENTS.md` as authoring guidance instead of a
  lint-enforced requirement.
- Remove generic `@returns {object}` and `@returns {object[]}` annotations when
  the function body already makes the return shape obvious.

## Rationale

- The current lint warning was not an intentional policy choice.
- Generic `object` return annotations hide useful inference instead of improving
  it.
- The repo guidance already explains when `@returns` adds value and when it
  should be omitted.
