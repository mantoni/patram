# Package Metadata v0 Roadmap

- Kind: roadmap
- Status: active

## Goal

- Tighten the published package contents.
- Add standard repository, homepage, engine, and license metadata.

## Scope

- Update `package.json` publish metadata.
- Add a package metadata contract test.
- Add an MIT license file.

## Order

1. Document the package metadata decision.
2. Add failing tests for the publish metadata contract.
3. Update `package.json` and add the license file.
4. Run validation.

## Acceptance

- `package.json` defines a `files` allowlist.
- The `files` allowlist excludes tests and docs from the published package.
- `package.json` defines the GitHub repository URL.
- `package.json` defines the GitHub homepage URL.
- `package.json` defines a Node.js `22` engine requirement.
- `package.json` declares the MIT license.
- `LICENSE` exists and contains the MIT license text.
- `npm run all` passes.
