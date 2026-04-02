# Source Layout Modularization Plan

- kind: plan
- status: active
- decided_by: docs/decisions/source-layout-modularization.md

## Goal

- Make the codebase easier to learn by aligning filesystem layout, module
  boundaries, and test placement with the repo's documented source taxonomy.

## Scope

- Introduce subsystem directories under `lib/` for `cli`, `config`, `scan`,
  `parse`, `graph`, `output`, and `support`.
- Split large coordinator files into smaller modules while moving them.
- Preserve the package root, CLI entrypoint, and existing command behavior
  during migration.
- Keep unit tests adjacent to moved modules and keep repo-level contract tests
  in `test/`.
- Document and enforce dependency rules between subsystems.

## Order

1. Document the source layout decision and migration plan.
2. Move CLI dispatch into `lib/cli/` and split per-command handlers.
3. Split config loading into `config/load.js`, `config/schema.js`,
   `config/defaults.js`, and config validation helpers.
4. Move source scanning and claim parsing into `scan/` and `parse/` folders and
   split parser-family helpers by format.
5. Split graph construction, identity, query parsing, query semantics, and query
   execution into `graph/`.
6. Split output view-model construction, plain/rich/json renderers, and rich
   source rendering into `output/`.
7. Collapse remaining cross-cutting helpers into `support/` only where a shared
   utility is clearly subsystem-neutral.
8. Remove migration shims after imports and tests no longer depend on them.
9. Run full validation and update source-anchor coverage to match the new
   layout.

## Work Slices

### Slice 1: CLI

- Turn `lib/patram-cli.js` into a thin coordinator.
- Create one command module per user-facing command.
- Keep shared output and error handling consistent across commands.

### Slice 2: Config And Query Semantics

- Separate file I/O from Zod schema definitions.
- Separate query parsing from query semantic diagnostics.
- Keep config-driven query validation behavior unchanged.

### Slice 3: Graph And Output

- Split graph materialization, identity resolution, and query execution.
- Split output view-model building from renderer selection and formatting.
- Isolate rich source rendering as its own output subsystem.

## Acceptance

- A new contributor can locate CLI, config, parser, graph, and output code from
  directory names alone.
- No runtime module in `lib/` remains responsible for more than one major
  subsystem.
- `lib/patram.js` and `bin/patram.js` keep their supported public behavior.
- Adjacent unit tests move with implementation files without mixing repo-level
  contract tests back into `lib/`.
- Source-anchor docs and queries still describe the moved code accurately.
- `npm run all` passes after each migration slice and after the full migration.
