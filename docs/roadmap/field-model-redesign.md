# Field Model Redesign Roadmap

- kind: roadmap
- status: active

## Goal

- Replace Patram's fixed query field model with an explicit schema-driven field
  model.
- Separate Patram-owned structural fields from repo-defined metadata fields.
- Make the new field model usable across config, graph materialization, query
  semantics, output, and discovery.

## Scope

- Structural field namespace:
  - `$id`
  - `$class`
  - `$path`
- Explicit metadata field definitions and class-local usage rules.
- Type-driven query operators.
- Open metadata output.
- Field discovery command group.
- Repo dogfooding of the new model.

## Order

1. Finalize redesign decisions.
2. Define config vocabulary and validation.
3. Update query parsing and evaluation.
4. Update graph materialization and conflict handling.
5. Update output contracts and renderers.
6. Add field discovery workflows.
7. Migrate repo config and docs.
8. Dogfood and validate the repo.

## Milestones

### M1

- [Field Model Redesign Plan](../plans/v1/field-model-redesign.md)
- Tests for config schema land.

### M2

- Query and materialization work land.
- Tests for field semantics and conflict handling pass.

### M3

- Output and discovery work land.
- Repo migration and dogfooding land.
- `npm run all` passes.

## Acceptance

- Patram uses the new field model consistently across config, graph, queries,
  output, and discovery.
- Repo docs and config dogfood the new model.
- `npm run all` passes.
