# Execution Summary Output Plan

- Kind: plan
- Status: active
- Tracked in: docs/roadmap/query-language-extensions.md
- Decided by: docs/decisions/execution-summary-output.md

## Goal

- Make derived execution state visible when users inspect worktracking documents
  through `patram`.
- Let users see that a plan, decision, or roadmap is done without mutating the
  document's stored `Status`.

## Scope

- Add derived execution summaries to `query` results for `decision`, `plan`, and
  `roadmap` documents.
- Add a self-summary block to `show` output for the document being shown.
- Add JSON output fields for derived execution summaries.
- Keep stored lifecycle metadata and derived execution metadata distinct.
- Keep `task` and `idea` output unchanged in the first pass.

## Derived Fields

- `execution`
- `open_tasks`
- `blocked_tasks`
- `total_tasks`

## Derived States

- `not_started`
- `in_progress`
- `blocked`
- `done`

## Examples

```txt
document docs/plans/v0/query-traversal-and-aggregation.md
kind: plan  status: active
execution: done  open_tasks: 0  blocked_tasks: 0  total_tasks: 4

    Query Traversal And Aggregation Plan
```

```txt
# Query Traversal And Aggregation Plan

...

----------------
document docs/plans/v0/query-traversal-and-aggregation.md
kind: plan  status: active
execution: done  open_tasks: 0  blocked_tasks: 0  total_tasks: 4

    Query Traversal And Aggregation Plan
```

## Order

1. Record an execution-summary-output decision that defines display rules and
   derived-state semantics.
2. Update entity-summary and CLI output conventions with plain and JSON
   examples.
3. Add failing renderer, view-model, and repo-level tests for derived execution
   summaries in `query` and `show`.
4. Extend output view construction to attach derived execution summaries for
   supported worktracking kinds.
5. Update the `plain`, `rich`, and `json` renderers.
6. Run validation.

## Acceptance

- `patram query` shows derived execution summaries for `decision`, `plan`, and
  `roadmap` documents.
- `patram show <plan-doc>` renders a self-summary block for the shown plan
  before resolved-link summaries.
- `plain`, `rich`, and `json` output keep the same execution facts.
- Stored `Status` remains a lifecycle field and does not switch to derived
  execution state.
- `npm run all` passes.
