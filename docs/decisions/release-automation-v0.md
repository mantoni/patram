# Release Automation v0 Proposal

- Kind: decision
- Status: accepted
- Tracked in: docs/roadmap/release-automation-v0.md

- Use `npm version patch|minor|major` as the release entrypoint.
- Run `npm run all` from the `preversion` lifecycle script.
- Generate `CHANGELOG.md` from Git commit subjects since the previous tag.
- Link each changelog entry to its GitHub commit URL.
- Emit generated changelog Markdown in a format that passes the repository
  Prettier check without a follow-up formatting step.
- Stage `CHANGELOG.md`, `package.json`, and `package-lock.json` in the `version`
  lifecycle script.
- Push the release commit and tag from the `postversion` lifecycle script.
- Publish from GitHub Actions on tag pushes instead of from a developer
  workstation.
- Publish with explicit public access so first releases can succeed with npm
  provenance enabled.
- Create the GitHub release from the latest `CHANGELOG.md` section.
- Use npm trusted publishing on GitHub-hosted runners.

## Rationale

- Keep release UX aligned with manual semver decisions.
- Avoid conventional commit or release-PR workflow overhead.
- Make release notes readable with only the information already present in the
  Git history.
- Reuse the same release notes for `CHANGELOG.md` and the GitHub release.
- Move publishing into a clean, reproducible CI environment.
