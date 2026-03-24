# Metadata Field Schema Proposal

- Kind: decision
- Status: accepted

- Patram config defines global metadata fields in a top-level `fields` section.
- Patram config defines per-class field usage in a top-level `class_schemas`
  section.
- Global field definitions own:
  - type
  - shared constraints
  - query semantics options
  - plain-output display options
  - multiplicity
- Class-local schemas own:
  - whether a field is allowed on that class
  - whether a field is required, optional, or forbidden
- Metadata fields are single-valued by default.
- Multi-valued metadata fields must opt in explicitly.
- Multiplicity is global and cannot be overridden per class.
- Metadata field display settings are global by default.
- Patram does not impose a naming style such as `lower_snake_case` on metadata
  field names.
- A metadata field name is the exact key declared in schema, as long as it does
  not begin with `$`.

## Rationale

- Global field meaning and per-class field usage are separate concerns.
- Single-valued by default keeps schemas concise for common fields such as
  `phase`, `owner`, `risk`, and `review_gate`.
- Global multiplicity keeps one field shape stable across the graph.

## Consequences

- Config validation must reject metadata field names beginning with `$`.
- Output visibility and order can be expressed once on the global field
  definition instead of repeated per class.
