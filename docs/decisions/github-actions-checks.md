# GitHub Actions Checks Proposal

- Kind: decision
- Status: accepted
- Tracked in: docs/plans/v0/github-actions-checks.md

- Add a GitHub Actions workflow for repository validation.
- Run the workflow on `push` and `pull_request`.
- Use a Node.js matrix with versions `22`, `24`, and `25`.
- Use `actions/setup-node` npm caching.
- Run each check and test command in its own workflow step.

## Rationale

- Keep CI coverage aligned with the repo's documented validation commands.
- Make failures easy to locate by separating commands into distinct steps.
- Validate against supported current Node.js releases.
