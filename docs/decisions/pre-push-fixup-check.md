# Pre-Push Fixup Check Proposal

- kind: decision
- status: accepted
- tracked_in: docs/plans/v0/pre-push-fixup-check.md

- Use a Husky `pre-push` hook to block pushes that include `fixup!` commits.
- Implement the check directly in the hook shell script.
- Use `@{u}..HEAD` when the current branch already has an upstream.
- Use `HEAD --not --remotes` before the first upstream push on a branch.
- Match both `fixup!` and `squash!` subjects.

## Rationale

- Catch unfinished history cleanup before it leaves the local repo.
- Keep the hook small and easy to inspect.
- Fit the repo's single-branch push-to-upstream workflow.
