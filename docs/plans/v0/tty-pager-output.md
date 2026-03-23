# TTY Pager Output Plan

- Kind: plan
- Status: active
- Tracked in: docs/roadmap/v0-dogfood.md
- Decided by: docs/decisions/tty-pager-output.md
- Decided by: docs/decisions/query-pagination.md
- Decided by: docs/decisions/show-output.md
- Decided by: docs/decisions/cli-output-architecture.md

## Goal

- Route interactive `show` and `query` output through a pager.
- Keep non-interactive output unchanged.
- Remove the implicit `query` result cap only for pager-backed TTY runs.

## Scope

- Document pager-backed CLI output behavior.
- Add failing tests for pager selection and TTY-specific query pagination.
- Implement pager-aware output writing in the CLI runtime.
- Preserve existing diagnostics, renderers, and explicit `--limit` handling.

## Order

1. Update the CLI output convention with pager-specific query examples.
2. Add failing CLI tests for pager usage and TTY query pagination.
3. Implement pager selection and output routing for `show` and `query`.
4. Refactor command output helpers if needed.
5. Run validation.

## Acceptance

- `patram show docs/patram.md` pages output when run in a TTY.
- `patram query pending-tasks` pages output when run in a TTY.
- `patram query pending-tasks` shows all matches by default in pager mode.
- `patram query pending-tasks --limit 5` still limits paged output.
- `patram query pending-tasks | cat` keeps direct stdout output and the default
  limit.
- `npm run all` passes.
