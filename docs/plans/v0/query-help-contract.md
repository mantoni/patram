# Query Help Contract Plan

- Kind: plan
- Status: active
- Tracked in: docs/roadmap/v0-dogfood.md
- Decided by: docs/decisions/query-help-contract.md

## Goal

- Publish an immediate, parser-accurate contract for the shipped query syntax.

## Scope

- Update `query --help` with concrete where-clause forms and examples.
- Update `patram help query-language` with the supported field, relation,
  traversal, aggregate, and comparison grammar.
- Update the canonical query command reference to match the CLI help contract.
- Keep the external docs checkout copy of the query command reference aligned.

## Order

1. Record the help contract decision.
2. Update help fixtures to the expected contract.
3. Update CLI help metadata and rendering.
4. Update the command reference copies.
5. Run validation.

## Acceptance

- `patram query --help` documents the shipped where-clause forms.
- `patram help query-language` lists the supported grammar users can rely on.
- The query command reference matches the CLI help contract.
- `npm run all` passes.
