# TypeScript ESLint Typed Linting Plan

- kind: plan
- status: active
- decided_by: docs/decisions/typescript-eslint-typed-linting.md

## Goal

- Install `typescript-eslint`.
- Enable ESLint linting with type information for repository JavaScript and
  TypeScript files.
- Adopt the recommended flat configs for typed linting with one consistent rule
  set across repo files.

## Scope

- Add a repo-level ESLint config contract test for typed linting.
- Install `typescript-eslint` as a development dependency.
- Downgrade `typescript` to a stable `5.x` release supported by
  `typescript-eslint`.
- Update `eslint.config.js` to use the recommended and recommended typed flat
  configs plus `parserOptions.projectService`.
- Remove file-specific typed-rule compatibility overrides by fixing the
  underlying code issues they were masking.
- Update lockfile state for the dependency change.

## Order

1. Document the decision and plan.
2. Add failing ESLint config tests for a supported TypeScript baseline and a
   uniform typed rule set.
3. Downgrade TypeScript and simplify the ESLint config.
4. Fix the lint failures exposed by the consistent typed rules.
5. Run validation.

## Acceptance

- `package.json` declares `typescript-eslint` in `devDependencies`.
- `package.json` declares a `typescript` version supported by
  `typescript-eslint`.
- The repo ESLint config enables typed linting via project service.
- The recommended `typescript-eslint` flat configs are part of the exported
  ESLint config.
- The repo does not rely on file-specific typed-rule disablements to pass lint.
- `npm run all` passes.
