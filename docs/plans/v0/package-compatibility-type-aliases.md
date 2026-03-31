# Package Compatibility Type Aliases Plan

- Kind: plan
- Status: done
- Decided by: docs/decisions/package-compatibility-type-aliases.md

## Goal

- Let downstream package consumers replace local `patram` compatibility shims
  with package-root type imports.

## Scope

- Add package-root declaration aliases for `PatramParseResult` and
  `PatramQueryGraphOptions`.
- Extend packed-package smoke coverage to import and use the compatibility
  aliases.
- Keep the runtime exports and query behavior unchanged.

## Order

1. Document the compatibility alias decision and plan.
2. Add failing packed-package consumer coverage for the compatibility names.
3. Implement the package-root declaration aliases.
4. Run validation and mark the plan done after the change lands.

## Acceptance

- TypeScript consumers can import `PatramParseResult` and
  `PatramQueryGraphOptions` from `patram`.
- Existing imports of `loadProjectGraph`, `parseWhereClause`, and `queryGraph`
  keep working without runtime changes.
- `npm run all` passes.
