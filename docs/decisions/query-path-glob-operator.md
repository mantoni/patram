# Query Path Glob Operator Proposal

- Kind: decision
- Status: accepted
- Tracked in: docs/plans/v1/query-path-glob-operator.md
- Extends: docs/decisions/type-driven-query-operators.md

- Add the `*=` query operator for glob matching against `$path`.
- `*=` is available only on the reserved structural `$path` field.
- `*=` uses Node path glob semantics against Patram's repo-relative POSIX
  `$path` values.
- `*=` matches one node when its `$path` satisfies the supplied glob expression.
- `*=` does not add glob matching to other structural fields or metadata fields
  in this change.

## Rationale

- Prefix matching is too limited for common path queries such as
  `docs/**/query-*.md`.
- Keeping glob matching on `$path` addresses the concrete path-query use case
  without broadening the metadata field operator matrix yet.
- Reusing Node's built-in glob matcher keeps Patram aligned with the runtime and
  avoids another dependency surface.

## Consequences

- Query parsing must recognize `field*=value` terms.
- Semantic validation must allow `*=` for `$path` and continue rejecting it for
  other fields.
- Query execution must evaluate `$path*=<glob>` against repo-relative paths.
- Query help and reference docs must document the new operator.
