# Knip Dead Code Check Proposal

- kind: decision
- status: accepted
- tracked_in: docs/plans/v0/knip-dead-code-check.md

- Use `knip` for repo-local dead code analysis.
- Install `knip` as a development dependency.
- Expose the check through `npm run check:knip`.
- Run `npm run check:knip` from `npm run all`.
- Run `npm run check:knip` in GitHub Actions checks.
- Add a repo-managed `knip` configuration only for confirmed local false
  positives.
- Fix dead code findings that block the repo check instead of suppressing them.

## Rationale

- Use a standard static-analysis tool instead of ad hoc unused-code searches.
- Keep dead-code validation part of the default local and CI workflows.
- Document any repo-specific ignores explicitly instead of relying on tribal
  knowledge.
