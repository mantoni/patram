# Knip Dead Code Check Plan

- Kind: plan
- Status: active

## Goal

- Install `knip` in the repo.
- Add a dedicated npm script for dead code analysis.
- Make dead code analysis part of the default validation path.
- Fix the initial dead-code findings.

## Scope

- Add `knip` to `devDependencies`.
- Add `check:knip` to `package.json`.
- Add `check:knip` to `npm run all`.
- Run `check:knip` in GitHub Actions checks.
- Add repo-local `knip` configuration only if the first run needs it.
- Validate touched files and the full repo command set.

## Order

1. Document the tool choice.
2. Add failing tests for the package and workflow contracts.
3. Install `knip` and expose it through the validation scripts.
4. Run `knip`, refine configuration for confirmed false positives, and fix the
   reported dead code.
5. Run repo validation.

## Acceptance

- `package.json` includes `knip` in `devDependencies`.
- `package.json` includes `npm run check:knip`.
- `npm run all` includes `npm run check:knip`.
- `.github/workflows/checks.yml` runs `npm run check:knip` in its own step.
- Any `knip` configuration documents only confirmed local exceptions.
- `npm run check:knip` passes.
- `npm run all` passes.
