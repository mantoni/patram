# Stored Query Descriptions Plan

- Kind: plan
- Status: active
- Tracked in: docs/roadmap/v0-dogfood.md
- Decided by: docs/decisions/stored-query-descriptions.md

## Goal

- Let repos annotate stored queries with optional descriptions and render those
  descriptions in `patram queries` without disturbing the existing compact
  layout for queries that omit them.

## Scope

- Add config support for an optional stored-query `description`.
- Add failing tests for config loading, stored-query listing, renderer output,
  and CLI integration.
- Render optional descriptions in plain and rich `queries` output.
- Include optional descriptions in `queries` JSON output.
- Update the stored-query and CLI output docs.

## Order

1. Add the failing tests that lock the description-aware output contract.
2. Extend stored-query config loading and list/view-model shapes.
3. Update the `queries` renderers and shared layout logic.
4. Align the repo docs and validation.

## Acceptance

- Stored queries may define `description` in `.patram.json`.
- `patram queries` prints the description block only when a query defines one.
- Descriptions use a four-space indent and have exactly one blank line before
  and after the block.
- `query <name>` behavior stays unchanged.
- `npx vitest run` passes on touched tests.
- `npm run all` passes.
