# Remove Derived Summaries Plan

- Kind: plan
- Status: active
- Decided by: docs/decisions/remove-derived-summaries.md

## Goal

- Remove derived summaries as a product feature and simplify config and output
  contracts accordingly.

## Scope

- Remove `derived_summaries` from config schema, config loading, and validation.
- Remove derived-summary evaluation from output generation and CLI command
  wiring.
- Remove derived-summary fields from shared output models and JSON rendering.
- Remove repo-owned derived-summary config and tests.
- Update docs to describe the breaking change.

## Work Breakdown

1. Add failing tests that treat `derived_summaries` as unsupported config and
   stop expecting derived-summary output.
2. Remove config schema, types, defaults, and validation for derived summaries.
3. Remove the derived-summary evaluator and its command/output integrations.
4. Remove derived-summary rendering helpers and JSON payload fields.
5. Update repo config, tests, and docs to the new contract.
6. Run `npm run all`.

## Acceptance

- `.patram.json` rejects `derived_summaries`.
- `query`, `refs`, and `show` never compute or render derived summaries.
- JSON output never includes `derived_summary` or `derived`.
- Repo docs and fixtures no longer mention derived summaries.
