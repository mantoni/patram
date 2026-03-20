# Work Item Conventions v0 Proposal

- Kind: convention
- Status: active

## Kinds

- `task`
- `decision`
- `roadmap`
- `convention`
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
- `proposed`
- `accepted`
- `active`

## Suggested Markdown Pattern

```md
# Implement query command

- Kind: task
- Status: pending
- Tracked in: docs/roadmap/v0-dogfood.md
- Decided by: docs/decisions/query-command-v0.md
- Decided by: docs/decisions/query-language-v0.md
```

## Placement

- Put metadata immediately after the title.
- Use list items in this repo.
- Allow directive formatting to stay project-defined.
- Keep directive names in title case.
- Use repo-relative paths.
