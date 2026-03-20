# Query Language v0 Proposal

- Query language is string-based.
- Query language is config-stored.
- Query language is CLI-accepted.
- Query language targets nodes.

## Supported Terms

- `kind=<value>`
- `status=<value>`
- `path=<value>`
- `path^=<prefix>`
- `title~<text>`
- `<relation>:*`
- `not <relation>:*`

## Supported Operators

- `and`
- `not`

## Deferred

- `or`
- parentheses
- traversal
- aggregation
- ordering
- projections

## Examples

```txt
kind=task and status=pending
kind=task and status=blocked
kind=task and not blocked_by:*
kind=decision and status=accepted
path^=docs/roadmap/
```
