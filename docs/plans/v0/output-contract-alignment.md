# Output Contract Alignment Plan

- Kind: plan
- Status: active
- Tracked in: docs/roadmap/v0-dogfood.md

## Goal

- Bring `check` and `queries` back in line with the documented v0 CLI output
  contract.
- Make the `rich` renderer style metadata consistently.
- Unblock dogfooding on this repo after the output contract is fixed.

## Scope

- Make `check` match the canonical `plain`, `rich`, and `json` layouts from
  `docs/conventions/cli-output-v0.md`.
- Specify canonical `queries` output and remove conflicting guidance from
  `docs/conventions/query-results-v0.md`.
- Dim both metadata keys and metadata values for `kind` and `status` in `rich`
  output.
- Fix the remaining repo dogfood failures only after the output contract is
  testable on the repo itself.

## Order

1. Document the missing `queries` output contract and consolidate the canonical
   conventions source.
2. Add failing tests for `check` output, `queries` output, and rich metadata
   styling.
3. Align `check` rendering and summaries with `cli-output-v0`.
4. Align `queries` rendering with the canonical conventions.
5. Fix the repo dogfood failures in docs or markdown claim parsing.
6. Run validation and dogfood on this repo.

## Acceptance

- `patram check` plain output matches `docs/conventions/cli-output-v0.md`.
- `patram check --json` emits the documented diagnostics shape.
- Successful `patram check` prints the documented success summary.
- `patram queries` has one canonical documented layout.
- `docs/conventions/query-results-v0.md` no longer conflicts with
  `docs/conventions/cli-output-v0.md`.
- `rich` output dims both metadata labels and metadata values for `kind` and
  `status`.
- `patram check` exits `0` on this repo.
- `patram query pending` lists the remaining follow-up tasks until the plan is
  complete.
