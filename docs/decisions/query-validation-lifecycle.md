# Query Validation Lifecycle Proposal

- kind: decision
- status: accepted

- Stored queries are validated against config and schema during config load.
- Ad hoc queries are validated during query execution.
- Parser validation checks syntax.
- Semantic validation checks:
  - known field names
  - reserved `$` field names
  - valid operators for the field
  - known relations
  - valid aggregate and traversal structure
- Stored-query validation failures block config load.
- Ad hoc query validation failures return diagnostics without executing the
  query.
- `--lint` and `--explain` use the same validation pipeline.

## Rationale

- Stored queries are repo configuration and should fail early.
- Ad hoc queries are user input and can only be checked at execution time.
- One validation model keeps behavior consistent across both entry points.

## Consequences

- Queries against undeclared metadata fields fail semantic validation with an
  explicit unknown-field diagnostic.
- Queries against unrecognized `$` fields fail with a reserved-namespace
  diagnostic.
