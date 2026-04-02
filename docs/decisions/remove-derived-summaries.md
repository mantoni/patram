# Remove Derived Summaries Proposal

- Kind: decision
- Status: accepted
- Tracked in: docs/plans/v0/remove-derived-summaries.md

- Remove the `derived_summaries` feature from Patram entirely.
- Remove derived-summary evaluation from `query`, `refs`, and `show`.
- Remove derived-summary rows from `plain` and `rich` output.
- Remove `derived_summary` and `derived` from JSON output.
- Reject `derived_summaries` in `.patram.json`.
- This change does not preserve backward compatibility.

## Rationale

- Derived summaries add a second metadata channel with separate config,
  validation, evaluation, and rendering rules.
- Removing the feature simplifies the config model and the shared output view.
- The repo-specific worktracking summaries are not worth keeping as a generic
  product feature.

## Consequences

- Existing repos that configure `derived_summaries` must remove that config.
- Output no longer includes derived execution metadata for plans or decisions.
- The repo docs and tests must stop describing derived-summary behavior.
