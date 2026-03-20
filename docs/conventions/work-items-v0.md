# Work Item Conventions v0 Proposal

## Kinds

- `task`
- `decision`
- `roadmap_item`

## Common Fields

- `kind`
- `status`
- `title`
- `path`

## Common Relations

- `blocked_by`
- `decided_by`
- `tracked_in`
- `implements`

## Status

- `pending`
- `in_progress`
- `done`
- `blocked`
- `dropped`

## Suggested Markdown Pattern

```md
# Implement query command

Kind: task Status: pending Tracked in: docs/roadmap/v0-dogfood.md Blocked by:
docs/decisions/query-language-v0.md
```
