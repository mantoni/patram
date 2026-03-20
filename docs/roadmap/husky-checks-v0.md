# Husky Checks v0 Roadmap

- Kind: roadmap
- Status: active

## Goal

- Install Husky in the repo.
- Configure a pre-commit hook.
- Run only low-noise staged checks before commit.

## Scope

- Add Husky to `devDependencies`.
- Add the package setup script Husky expects.
- Ensure `npm run all` covers the defined checks.
- Add `lint-staged` configuration.
- Add a repo-managed pre-commit hook.
- Keep full validation in `npm run all`.

## Order

1. Document the hook decision.
2. Add failing tests for the `lint-staged` setup.
3. Add the `lint-staged` configuration.
4. Configure the pre-commit hook to run `lint-staged`.
5. Run validation.

## Acceptance

- `package.json` includes Husky in `devDependencies`.
- `package.json` includes the Husky setup script.
- `package.json` routes `npm run all` through lint, format, types, tests, and
  duplicate checks.
- `package.json` includes a staged-check script for pre-commit use.
- `package.json` includes `lint-staged` configuration.
- `.husky/pre-commit` exists in the repo.
- `.husky/pre-commit` runs the staged-check script.
- Prettier checks only staged supported files.
- ESLint checks only staged JavaScript and TypeScript files.
- Vitest runs only related tests for staged JavaScript and TypeScript files.
- `npm run all` passes.
