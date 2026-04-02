# Query Filename Field Plan

- Kind: plan
- Status: superseded
- Tracked in: docs/roadmap/query-language-extensions.md
- Decided by: docs/decisions/query-filename-field.md
- Superseded by: docs/plans/v1/structural-identity-functions.md

## Goal

- Add a structural `$filename` query field for exact filename matching on
  file-backed nodes.

## Scope

- Query semantic validation for `$filename`.
- Query execution support for `$filename`.
- Stored-query config validation for `$filename`.
- CLI help and query command docs for `$filename`.
- Focused tests for validation, evaluation, and help output.

## Order

1. Add failing tests for validation, execution, and help text.
2. Implement `$filename` derivation and structural-field support.
3. Update query help and reference docs.
4. Run repo validation and commit the change.

## Acceptance

- Ad hoc and stored queries accept `$filename`.
- `$filename=README.md` matches nodes whose `$path` basename is `README.md`.
- Nodes without `$path` do not match `$filename` terms.
- `$filename^=README` fails semantic validation.
- Help and reference docs list `$filename` as a supported structural field.
