# Type-Driven Query Operators Proposal

- Kind: decision
- Status: accepted
- Supersedes: docs/decisions/query-language.md

- Patram keeps the current where-clause operator syntax:
  - `field=value`
  - `field<>value`
  - `field^=value`
  - `field~value`
  - `field in [value, ...]`
  - `field not in [value, ...]`
  - `field < value`
  - `field <= value`
  - `field > value`
  - `field >= value`
- Query operators are determined by core-field semantics or metadata field type,
  not by metadata field name.
- Reserved core field operators are:
  - `$id`: exact, membership, prefix
  - `$class`: exact, membership
  - `$path`: exact, membership, prefix
  - `title`: exact, membership, contains
- Metadata field operators are:
  - `string`: exact, membership
  - `string` with opt-in: contains, prefix
  - `enum`: exact, membership
  - `integer`: exact, membership, ordered comparisons
  - `date`: exact, membership, ordered comparisons
  - `date_time`: exact, membership, ordered comparisons
  - `path`: exact, membership, prefix
  - `glob`: exact, membership
- Invalid operator and field combinations are query errors.

## Rationale

- The query language should generalize to arbitrary metadata fields without
  inventing a new syntax.
- Type-driven semantics let any path-typed field support prefix matching without
  hard-coding that behavior to one field name.

## Consequences

- Parser validation remains syntactic.
- Semantic validation must resolve field names and operator support from the
  field model.
- Existing special cases such as `title~` and `path^=` become core-field or
  type-driven semantics instead of field-name allowlists.
