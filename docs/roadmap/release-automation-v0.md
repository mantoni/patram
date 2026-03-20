# Release Automation v0 Roadmap

- Kind: roadmap
- Status: active

## Goal

- Make `npm version patch|minor|major` execute the full release flow.
- Generate a changelog section from plain Git commit subjects.
- Publish on tag push and create a matching GitHub release.

## Scope

- Add version lifecycle scripts to `package.json`.
- Add a changelog generator in `scripts/`.
- Add tests for the release contract and changelog generation.
- Add a release workflow in `.github/workflows/`.
- Add an initial `CHANGELOG.md`.

## Order

1. Document the release automation decision.
2. Add failing tests for the release contract and changelog output.
3. Add the changelog generator and package lifecycle scripts.
4. Add the tag-driven publish and release workflow.
5. Run validation.

## Acceptance

- `package.json` defines `preversion`, `version`, and `postversion`.
- `preversion` runs `npm run all`.
- `version` updates `CHANGELOG.md` and stages release files.
- `postversion` pushes the release commit and tag.
- `scripts/update-changelog.js` builds changelog entries from Git commit
  subjects.
- `CHANGELOG.md` exists and uses the generated section format.
- The generated changelog output passes the staged-file Prettier check.
- `.github/workflows/release.yml` publishes on version tag pushes.
- `.github/workflows/release.yml` creates a GitHub release from the latest
  changelog section.
- `npm run all` passes.
