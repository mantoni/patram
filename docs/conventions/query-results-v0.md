# Query Results v0 Proposal

- Kind: convention
- Status: active

## Default Output

- One result per line.
- Human-readable text.
- Stable column order.

```txt
doc:docs/tasks/v0/query-command.md task Implement query command
doc:docs/decisions/query-language-v0.md decision Query Language v0
```

## Named Query Output

```txt
pending kind=task and status=pending
blocked kind=task and status=blocked
accepted-decisions kind=decision and status=accepted
```

## Empty Output

- Print no result lines.
- Exit `0`.

## Failure Output

- Print diagnostics.
- Exit `1`.
