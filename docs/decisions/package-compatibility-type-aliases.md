# Package Compatibility Type Aliases Proposal

- Kind: decision
- Status: accepted
- Tracked in: docs/plans/v0/package-compatibility-type-aliases.md

- Expose `PatramParseResult` and `PatramQueryGraphOptions` from the package root
  declaration surface.
- Keep both names as aliases of the current query parse and query option
  contracts instead of introducing separate compatibility wrapper shapes.
- Treat the alias names as package-level compatibility affordances for
  downstream consumers that currently carry local `patram` declaration shims.

## Rationale

- Downstream TypeScript consumers should be able to depend on the supported
  query API names without maintaining duplicate ambient declarations.
- Aliasing the existing contracts keeps the public runtime API unchanged while
  letting consumers remove repo-local compatibility shims.
- Keeping the compatibility names at the package root preserves the existing
  package entrypoint model from `lib/patram.d.ts`.
