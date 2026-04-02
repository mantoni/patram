# Schema-Defined Query Fields Proposal

- kind: decision
- status: accepted
- Supersedes: docs/decisions/query-language.md

- Queryable fields are:
  - Patram-owned structural fields
  - explicitly defined metadata fields
- Every defined metadata field is queryable.
- Patram does not define a separate `queryable` flag.
- Patram does not infer queryable metadata fields from incidental node shape.
- Undeclared metadata fields are invalid in queries.
- Metadata field names are exact schema keys.
- Patram does not define aliases or legacy field names for this model.
- This change does not preserve backward compatibility.

## Rationale

- Query behavior should come from explicit schema, not hard-coded field names.
- One metadata field definition should be enough to make that field available in
  stored queries, ad hoc queries, and aggregate subqueries.
- Exact schema keys avoid hidden normalization rules and make onboarding
  explicit.

## Consequences

- Stored queries and ad hoc queries resolve field names from the same schema
  surface.
- Discovery may suggest field definitions, but suggested fields are not active
  until explicitly adopted in config.
- Existing query docs and examples that depend on hard-coded unprefixed
  structural names are superseded by the newer structural namespace model.
