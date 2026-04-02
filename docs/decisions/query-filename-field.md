# Query Filename Field Proposal

- kind: decision
- status: accepted
- tracked_in: docs/plans/v1/query-filename-field.md

- Add `$filename` as a Patram-owned structural query field.
- `$filename` is derived from the basename of `$path`.
- `$filename` is available only on nodes with `$path`.
- `$filename` supports exact match and set-membership operators:
  - `=`
  - `<>`
  - `in`
  - `not in`
- `$filename` does not support prefix or contains matching.
- Patram does not define an unprefixed `filename` alias for this feature.

## Rationale

- Filename matching is derived from Patram-owned file identity rather than
  repo-authored metadata.
- Keeping the feature in the reserved structural namespace avoids config churn
  for a broadly useful file-backed query capability.
- Exact filename matching answers common queries such as
  `all files named README.md` without extending the language beyond the current
  field model.

## Consequences

- Query validation must recognize `$filename` as a reserved structural field.
- Query evaluation must derive `$filename` from `$path` instead of relying on
  incidental node shape.
- Query help and command reference docs must document `$filename` alongside the
  other structural fields.
