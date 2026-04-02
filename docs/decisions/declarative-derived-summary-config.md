# Declarative Derived Summary Config Proposal

- kind: decision
- status: accepted
- tracked_in: docs/plans/v0/declarative-derived-summaries.md

- Add an optional top-level `derived_summaries` object to `.patram.json`.
- Keep `derived_summaries` keyed by stable summary names such as
  `plan_execution`.
- Each summary definition declares one or more graph `kinds` that it applies to.
- In v0, a kind may appear in at most one derived summary definition.
- Each summary definition declares an ordered `fields` array, and renderers must
  preserve that order.
- Support two field evaluators in the first pass: `count` and `select`.
- `count` derives one numeric field from one directional traversal plus one
  nested `where` clause over related nodes.
- `select` derives one scalar field from ordered `when` clauses evaluated
  against the root node, returning the first matching `value` or the required
  `default`.
- Keep `when` and nested `where` clauses in the existing string query language
  instead of introducing a second expression DSL.
- Require field names to be unique within one summary definition and to use
  `lower_snake_case`.
- Leave output unchanged when `derived_summaries` is absent.

## Config Shape

```json
{
  "derived_summaries": {
    "decision_execution": {
      "kinds": ["decision"],
      "fields": [
        {
          "name": "execution",
          "select": [
            {
              "when": "count(in:decided_by, kind=task) > 0 and none(in:decided_by, kind=task and status not in [done, dropped, superseded])",
              "value": "done"
            },
            {
              "when": "any(in:decided_by, kind=task and status not in [done, dropped, superseded]) and none(in:decided_by, kind=task and status not in [done, dropped, superseded] and not status=blocked)",
              "value": "blocked"
            },
            {
              "when": "any(in:decided_by, kind=task and not status=pending)",
              "value": "in_progress"
            }
          ],
          "default": "not_started"
        },
        {
          "name": "open_tasks",
          "count": {
            "traversal": "in:decided_by",
            "where": "kind=task and status not in [done, dropped, superseded]"
          }
        },
        {
          "name": "blocked_tasks",
          "count": {
            "traversal": "in:decided_by",
            "where": "kind=task and status=blocked"
          }
        },
        {
          "name": "total_tasks",
          "count": {
            "traversal": "in:decided_by",
            "where": "kind=task"
          }
        }
      ]
    }
  }
}
```

## Validation Rules

- `derived_summaries` keys are summary identities and must be unique.
- Every summary definition must declare at least one kind and at least one
  field.
- Every field must declare exactly one evaluator: `count` or `select`.
- `count.traversal` must use `in:<relation>` or `out:<relation>`, and the named
  relation must exist in config.
- `count.where` and `select.when` must parse successfully with the same query
  parser used by `patram query`.
- `select` must declare at least one case and a `default`.
- `select` values and `default` values must be JSON scalars.
- Duplicate field names inside one summary are invalid.
- Duplicate kind coverage across summary definitions is invalid.

## Rationale

- Summary definitions stay repo-owned data instead of hardcoded product logic.
- Reusing the normal query language keeps traversal and aggregation semantics in
  one place.
- Kind-scoped definitions are simple to validate and make renderer behavior
  deterministic.
- Ordered fields let repos control plain, rich, and JSON output without adding
  renderer-specific config.
