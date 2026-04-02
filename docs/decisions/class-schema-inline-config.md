# Class Schema Inline Config Proposal

- kind: decision
- status: accepted

- Patram config stores class-local schema under `classes.<name>.schema`.
- Patram config no longer supports top-level `class_schemas`.
- Class definitions own:
  - structural class metadata such as `label` and `builtin`
  - class-local schema such as document placement, field presence, and unknown
    field policy
- Global field definitions remain in top-level `fields`.
- Class-local schema remains conceptually separate from global field
  definitions, even though both are authored through the `classes` tree.
- This change does not preserve backward compatibility.

## Rationale

- The current config duplicates class names across `classes` and
  `class_schemas`.
- Validation must cross-check those maps only to prove they describe the same
  class set.
- Authoring a class as one object is easier to read, edit, and explain.

## Consequences

- Config loading must reject top-level `class_schemas`.
- Runtime config normalization may still expose a separate class-schema lookup
  if that keeps downstream code simple.
- Repo config, tests, docs, and examples must migrate to
  `classes.<name>.schema`.
