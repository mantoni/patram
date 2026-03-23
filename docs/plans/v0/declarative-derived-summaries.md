# Declarative Derived Summaries Plan

- Kind: plan
- Status: active
- Tracked in: docs/roadmap/query-language-extensions.md
- Implements: docs/research/declarative-derived-summaries.md
- Decided by: docs/decisions/declarative-derived-summary-config.md
- Decided by: docs/decisions/declarative-derived-summary-side-effects.md

## Goal

- Replace hardcoded worktracking-derived output with repo-configured derived
  summaries.
- Keep derived summary evaluation generic enough to support multiple workflow
  and graph models without mutating stored metadata.

## Scope

- Extend `.patram.json` with optional derived summary definitions.
- Validate derived summary config with the existing config-loading path.
- Evaluate derived summaries against graph nodes at output time.
- Thread evaluated summaries through `query` and `show`.
- Keep `plain`, `rich`, and `json` output aligned on one shared derived-summary
  shape.
- Move the repo's worktracking execution summary into config once the generic
  evaluator exists.
- Update config and output conventions after runtime behavior lands.
- Defer querying derived fields, composing multiple summaries for one kind, and
  non-scalar derived values.

## Work Breakdown

1. Add failing config-schema and config-diagnostic tests for
   `derived_summaries`, including duplicate kind coverage, duplicate field
   names, invalid traversals, and invalid query clauses.
2. Extend config types and parsing to accept derived summary definitions and
   validate them against configured kinds, relations, and the query parser.
3. Add failing output-view and renderer tests for configured derived summaries
   in `query` and `show`, including JSON `derived_summary` and `derived`
   payloads.
4. Build a derived summary evaluator that picks one summary by node kind and
   evaluates ordered `count` and `select` fields without mutating graph nodes.
5. Thread derived summary results through command results and the shared output
   view model for query results, the shown document summary, and resolved-link
   targets.
6. Replace worktracking-specific summary logic with repo-owned
   `derived_summaries` definitions in `.patram.json`.
7. Update `docs/conventions/v0.md` and `docs/conventions/cli-output-v0.md` with
   the canonical config and output examples.
8. Run `npm run all`.

## Acceptance

- `.patram.json` can declare kind-scoped derived summaries with ordered fields.
- `patram query` renders derived summaries from config instead of hardcoded
  worktracking logic.
- `patram show` renders the shown document and resolved links with the same
  derived summary rules.
- Invalid derived summary definitions fail during config loading with clear
  diagnostics.
- Derived summaries do not change graph node identity, stored metadata, or query
  matching semantics.
- `plain`, `rich`, and `json` render the same derived field order and values.
