# JSDoc Metadata Directive Syntax Plan

- kind: plan
- status: active
- tracked_in: docs/roadmap/v0-dogfood.md
- decided_by: docs/decisions/jsdoc-metadata-directive-syntax.md

## Goal

- Add JSDoc-based Patram metadata parsing for JavaScript and TypeScript source
  files without changing graph materialization semantics.

## Scope

- Recognize activated JSDoc blocks in JavaScript and TypeScript source files.
- Extract explicit `Key: Value` directives anywhere in the activated block.
- Derive `document.title` and `document.description` claims from prose inside
  the activated block.
- Keep `@patram`, `@see`, and `@link` out of prose extraction.
- Emit neutral `directive` claims in the `jsdoc` parser namespace with exact
  source origins.
- Enforce deterministic behavior when a file contains multiple activated Patram
  blocks.
- Keep v0 directive values string-only and document-level.

## Order

1. Add failing parser tests for activated JSDoc block detection in JavaScript
   and TypeScript source files.
2. Add failing tests for `Key: Value` directives that appear before `@patram`,
   after `@patram`, and between JSDoc tags.
3. Add failing tests for wrapped prose paragraph extraction, long first
   paragraph title fallback, and description extraction.
4. Extend source-file classification to scan supported JavaScript and TypeScript
   source extensions for JSDoc metadata.
5. Implement JSDoc block scanning and activate Patram parsing only for blocks
   that contain `@patram`.
6. Implement directive extraction and normalization inside activated blocks.
7. Implement prose extraction and emit `document.title` and
   `document.description` claims.
8. Add validation or diagnostics for files that contain multiple activated
   Patram blocks.
9. Run validation and mark the plan done after implementation lands.

## Acceptance

- A JavaScript or TypeScript file with one activated Patram JSDoc block emits
  `directive` claims with parser `jsdoc` and exact origins.
- `Key: Value` directives are recognized regardless of their position relative
  to `@patram`.
- Wrapped prose lines within one paragraph become one normalized string.
- The first prose paragraph becomes the title source.
- When the first prose paragraph is longer than `120` characters and contains a
  sentence boundary, the title becomes the first sentence.
- Remaining prose becomes `document.description`.
- JSDoc blocks without `@patram` do not emit Patram claims.
- Lowercase prose lines such as `status: pending` do not emit directives.
- Files with multiple activated Patram blocks produce deterministic validation
  behavior.
- `npm run all` passes.
