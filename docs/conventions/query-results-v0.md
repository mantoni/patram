# Query Results v0 Proposal

## Default Output

- One result per line.
- Human-readable text.
- Stable column order.

```txt
task:query-command task Implement query command
decision:query-language-v0 decision Query Language v0
```

## Named Query Output

```txt
pending kind=task and status=pending
blocked kind=task and status=blocked
```

## Empty Output

- Print no result lines.
- Exit `0`.

## Failure Output

- Print diagnostics.
- Exit `1`.
