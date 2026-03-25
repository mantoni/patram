# Zod-Derived Config Types Plan

- Kind: plan
- Status: active
- Tracked in: docs/roadmap/v0-dogfood.md
- Decided by: docs/decisions/single-config-file.md
- Decided by: docs/decisions/metadata-field-schema.md
- Decided by: docs/decisions/declarative-derived-summary-config.md

## Goal

- Make the config schemas in `lib/patram-config.js` and
  `lib/load-patram-config.js` the source of truth for their corresponding JSDoc
  and TypeScript types.

## Scope

- Add schema-local `@typedef {z.output<typeof ...>}` declarations for the
  zod-backed config shapes.
- Replace duplicated manual config type declarations with aliases to the
  schema-derived types.
- Keep config-load runtime behavior unchanged.
- Add a focused typecheck assertion that imports config types from the schema
  modules.

## Order

1. Add a failing typecheck assertion that imports schema-derived config types.
2. Derive config types from the zod schemas in `lib/patram-config.js` and
   `lib/load-patram-config.js`.
3. Replace duplicated declarations in the matching `.types.ts` files with
   aliases or composed types.
4. Run focused validation and `npm run all`.

## Acceptance

- Config type names can be imported from the schema modules via JSDoc.
- Manual config type duplication is removed from the matching `.types.ts` files.
- `npx tsc` passes.
- `npm run all` passes.
