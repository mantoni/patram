# Query Language Proposal

- kind: decision
- status: accepted
- tracked_in: docs/roadmap/v0-dogfood.md

- Query language is string-based.
- Query language is config-stored.
- Query language is CLI-accepted.
- Query language targets nodes.

## Supported Terms

- `id=<value>`
- `id^=<prefix>`
- `kind=<value>`
- `status=<value>`
- `path=<value>`
- `path^=<prefix>`
- `title~<text>`
- `<relation>:*`
- `<relation>=<target-id>`
- `not <relation>:*`
- `not <relation>=<target-id>`

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
implements_command=command:query
uses_term=term:graph
```
