# Pre-Push Fixup Check Plan

- Kind: plan
- Status: active

## Goal

- Add a pre-push hook.
- Reject pushes that include `fixup!` or `squash!` commits.
- Keep the hook simple.

## Scope

- Add a repo-managed Husky `pre-push` hook.
- Check upstream pushes with `@{u}..HEAD`.
- Check first pushes with `HEAD --not --remotes`.
- Add a focused test for the hook content.

## Order

1. Document the decision.
2. Add a failing test for the hook content.
3. Simplify the pre-push hook.
4. Run validation.

## Acceptance

- `.husky/pre-push` exists.
- `.husky/pre-push` contains the shell check.
- Existing upstream pushes check `@{u}..HEAD`.
- First pushes check `HEAD --not --remotes`.
- Pushes with `fixup!` or `squash!` commits fail.
