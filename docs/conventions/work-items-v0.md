# Work Item Conventions v0 Proposal

- kind: convention
- status: active

## Kinds

- `decision`
- `plan`
- `roadmap`
- `task`
- `convention`

## Kind Placement

- `decision`: `docs/decisions/`
- `plan`: `docs/plans/<version>/`
- `roadmap`: `docs/roadmap/`
- `task`: `docs/tasks/<version>/`
- `convention`: `docs/conventions/`

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
# Release automation v0 plan

- kind: plan
- status: active
- decided_by: docs/decisions/release-automation.md
```

## Placement

- Put metadata immediately after the title.
- Use list items in this repo.
- Allow directive formatting to stay project-defined.
- Keep directive names in title case.
- Use repo-relative paths.
