# Query Command Proposal

- kind: decision
- status: accepted
- tracked_in: docs/roadmap/v0-dogfood.md

- Command name: `query`.
- Do not add a built-in `pending` command.
- Treat `pending` as a stored query name.
- Use one query engine for ad hoc and stored queries.

## Commands

```sh
patram query --where "kind=task and status=pending"
patram query pending
patram queries
```

## Rationale

- One mental model.
- One execution path.
- No enforced workflow.
- User-defined query names.
- User-defined work-item conventions.

## v0 Limits

- Query nodes only.
- No graph traversal.
- No sorting language.
- No aggregation.
