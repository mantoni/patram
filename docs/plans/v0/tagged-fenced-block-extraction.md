# Tagged Fenced Block Extraction Plan

- Kind: plan
- Status: done
- Tracked in: docs/roadmap/v0-dogfood.md
- Decided by: docs/decisions/tagged-fenced-block-extraction.md

## Goal

- Add a markdown-only API that extracts tagged fenced blocks from one file and
  supports exact metadata selection for specification-driven tests.

## Scope

- Parse hidden tagged-block metadata that appears outside fenced code blocks.
- Support single-pair and multi-pair hidden tag lines.
- Attach pending tag sets only to the next fenced block.
- Return file-level extraction results with block metadata, origins, and heading
  context.
- Add `selectTaggedBlock(...)` and `selectTaggedBlocks(...)` helpers for exact
  metadata matching.
- Keep tagged fenced block extraction separate from graph indexing and
  `patram query`.
- Add deterministic parse and selection diagnostics for malformed inputs and
  ambiguous singular matches.
- Add a path-based convenience wrapper that reads one file and delegates to the
  pure extractor.

## Order

1. Add failing parser tests for single-pair tags, multi-pair shorthand tags, and
   merged adjacent tag lines.
2. Add failing parser tests for blank-line tolerance, duplicate metadata keys,
   dangling tag sets, and prose between tags and fences.
3. Add failing parser tests for untagged fence exclusion and fenced-block origin
   metadata, including tag line numbers and heading context.
4. Add failing selector tests for exact metadata matching, zero-match errors,
   and multi-match errors.
5. Implement a markdown extractor that scans one file, tracks heading context,
   and emits tagged fenced block records in source order.
6. Implement strict tag parsing for lowercase snake case keys and raw
   non-whitespace values with no quoting or escaping in v0.
7. Implement `selectTaggedBlock(...)` and `selectTaggedBlocks(...)`.
8. Add a file-reading convenience wrapper for path-based callers.
9. Add repo-level documentation or fixture coverage that demonstrates
   specification-driven extraction.
10. Run validation and mark the plan done after implementation lands.

## Acceptance

- `extractTaggedFencedBlocks({ file_path, source_text })` returns one file-level
  result with all tagged fenced blocks in source order.
- `[patram example=query-basic role=input]: #` parses the same metadata as two
  equivalent single-pair tag lines.
- Tags attach only to the next fenced block and never float across prose.
- Untagged fenced blocks are ignored.
- Duplicate metadata keys in one pending tag set produce a parse error.
- Pending tag sets at end of file produce a parse error.
- `selectTaggedBlock(...)` returns one exact metadata match or throws a
  deterministic not-found or not-unique error.
- `selectTaggedBlocks(...)` returns all exact metadata matches in source order.
- The extraction API remains independent from graph query semantics.
- `npm run all` passes.
