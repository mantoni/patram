# Husky Checks Proposal

- Kind: decision
- Status: accepted
- Tracked in: docs/plans/v0/husky-checks.md

- Use Husky for repository-managed Git hooks.
- Install Husky as a development dependency.
- Keep `npm run all` as the single validation entry point.
- Include type checking in `npm run all`.
- Run `lint-staged` from the pre-commit hook.
- Run Prettier only on staged supported files.
- Run ESLint only on staged JavaScript and TypeScript files.
- Run Vitest related tests only for staged JavaScript and TypeScript files.
- Keep check orchestration in `package.json`.

## Rationale

- Keep pre-commit feedback fast and relevant.
- Avoid running full-repo validation on every commit.
- Reuse a standard staged-file workflow instead of custom scripting.
- Keep manual and CI validation available through `npm run all`.
- Let Git hooks stay thin and repo-local.
