# Output Contract Alignment Plan

- kind: plan
- status: active
- tracked_in: docs/roadmap/v0-dogfood.md

## Goal

- Adopt entity-summary output blocks for `query` and resolved-link footnotes in
  `show`.
- Bring `check` and `queries` back in line with the documented v0 CLI output
  contract.
- Make the `rich` renderer style metadata consistently.
- Unblock dogfooding on this repo after the output contract is fixed.

## Scope

- Update `query` and `show` conventions to use entity-summary blocks.
- Make `check` match the canonical `plain`, `rich`, and `json` layouts from
  `docs/conventions/cli-output-v0.md`.
- Specify canonical `queries` output and remove conflicting guidance from
  `docs/conventions/query-results-v0.md`.
- Finalize the `rich` color conventions for node references, metadata, and
  secondary structural text.
- Fix the remaining repo dogfood failures only after the output contract is
  testable on the repo itself.

## Order

1. Document entity-summary output for `query` and `show`, and consolidate the
   canonical `queries` conventions source.
2. Add failing tests for `query`, `show`, `check`, `queries`, and rich metadata
   styling.
3. Align `query` and `show` rendering with the entity-summary conventions.
4. Align `check` rendering and summaries with `cli-output-v0`.
5. Align `queries` rendering with the canonical conventions.
6. Fix the repo dogfood failures in docs or markdown claim parsing.
7. Run validation and dogfood on this repo.

## Acceptance

- `patram query` plain output matches the entity-summary layout in
  `docs/conventions/cli-output-v0.md`.
- `patram show` resolved-link footnotes match the entity-summary layout in
  `docs/conventions/cli-output-v0.md`.
- `patram check` plain output matches `docs/conventions/cli-output-v0.md`.
- `patram check --json` emits the documented diagnostics shape.
- Successful `patram check` prints the documented success summary.
- `patram queries` has one canonical documented layout.
- `docs/conventions/query-results-v0.md` no longer conflicts with
  `docs/conventions/cli-output-v0.md`.
- `rich` output color conventions match `docs/conventions/cli-output-v0.md`.
- `patram check` exits `0` on this repo.
- `patram query pending-tasks` lists the remaining follow-up tasks until the
  plan is complete.
