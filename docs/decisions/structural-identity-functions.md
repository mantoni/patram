# Structural Identity Functions Proposal

- kind: decision
- status: accepted
- tracked_in: docs/plans/v1/structural-identity-functions.md
- Supersedes: docs/decisions/patram-structural-field-namespace.md
- Supersedes: docs/decisions/query-filename-field.md
- Extends: docs/decisions/cypher-query-language.md

- Patram removes structural `$` field mappings.
- Patram mappings populate only metadata fields and relations.
- Patram resolves structural identity outside field mappings.
- Structural identity consists of:
  - class membership
  - semantic id
  - canonical repo-relative source path
- Cypher uses node labels for structural class membership.
- Cypher exposes structural scalar identity through functions:
  - `id(n)`
  - `path(n)`
- Patram does not support structural property aliases such as:
  - `n.id`
  - `n.class`
  - `n.path`
  - `n.filename`
- Patram does not support a structural filename function or field.
- Cypher property access `n.<field>` addresses metadata fields only.
- Metadata fields may use names such as `id`, `class`, `path`, and `filename`
  without colliding with Patram structural identity.
- `title` and `description` are metadata fields, not structural identity.
- `title` and `description` use fallback materialization precedence:
  1. explicit metadata value
  2. extracted value from source content
  3. deterministic fallback value
- This change is intentionally breaking.
- Patram does not provide backward compatibility for:
  - structural `$` field names
  - structural property aliases
  - structural filename queries

## Rationale

- Structural identity and repo-authored metadata are different concerns and
  should not compete in one field namespace.
- Removing structural field mappings eliminates name clashes such as a metadata
  field named `path` being shadowed by Patram's canonical source path.
- Cypher labels fit class membership better than scalar property access.
- Small structural functions keep structural access explicit while leaving plain
  property names available to repo metadata.
- Treating `title` and `description` as metadata with fallback materialization
  preserves their current role as user-facing fields without promoting them to a
  separate node surface.

## Consequences

- Graph materialization must split identity resolution from metadata field
  materialization.
- Config must define structural identity rules outside mapping targets.
- Query parsing and validation must treat:
  - labels as structural class predicates
  - `id(n)` as structural semantic-id access
  - `path(n)` as structural canonical-path access
  - `n.<field>` as metadata access only
- Query help and reference docs must stop documenting structural property
  aliases and structural `$` field names.
- Query operator rules must move structural path semantics from `$path` to
  `path(n)`.
- Stored queries and tests must migrate directly to the new syntax without a
  compatibility layer.

## Examples

```cypher
MATCH (n:Decision)
WHERE id(n) = 'decision:query-language'
RETURN n
```

```cypher
MATCH (n)
WHERE path(n) STARTS WITH 'docs/decisions/'
  AND n.path = 'release/query-language'
RETURN n
```

```cypher
MATCH (n)
WHERE path(n) ENDS WITH '/query-language.md'
RETURN n
```
