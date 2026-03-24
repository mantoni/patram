# Field Materialization And Conflict Semantics Proposal

- Kind: decision
- Status: accepted

- Node-field mappings may populate:
  - Patram structural fields when Patram permits it
  - explicitly defined metadata fields
- Node-field mappings must not create undeclared metadata fields.
- Metadata field names are global graph semantics.
- Different parsers and mappings may populate the same field.
- Parser-specific field variants are not part of the model.
- Conflicting values on a single-valued field are errors.
- Identical repeated values on a single-valued field do not conflict.
- Multi-valued fields use set semantics.
- Duplicate values in a multi-valued field collapse to one effective value.
- Multi-valued field output uses deterministic ordering rather than source-order
  preservation.

## Rationale

- Materialization, validation, and querying should operate on one explicit field
  model.
- Silent precedence rules would hide schema problems and make metadata behavior
  parser-dependent.
- Set semantics keep multi-valued query behavior simple and stable.

## Consequences

- Config load must reject mappings that target undeclared metadata fields or
  unknown Patram structural fields.
- Repos that want multiple values must declare the field as multi-valued.
- Query evaluation against multi-valued fields uses the effective set of values.
