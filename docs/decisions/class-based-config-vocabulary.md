# Class-Based Config Vocabulary Proposal

- Kind: decision
- Status: accepted

- Patram config uses `classes` as the structural classification section.
- Patram config no longer uses `kinds` for structural classification in the new
  model.
- `$class` values must reference configured `classes`.
- `class_schemas` are keyed by configured class names.
- Relation endpoint definitions use classes in their `from` and `to` lists.
- All query-like config expressions use `$id`, `$class`, and `$path`.
- This change does not preserve backward compatibility.

## Rationale

- One structural term across config, schema, queries, and output is easier to
  explain and onboard.
- Keeping `kinds` in config while using `$class` in the graph would preserve the
  old overload in a different place.

## Consequences

- Existing config terminology such as `kinds` must migrate to `classes`.
- Existing stored queries, derived summary expressions, and other embedded
  where-clauses that use structural names such as `kind`, `id`, and `path` must
  migrate to `$class`, `$id`, and `$path`.
- Repo metadata remains free to define ordinary fields such as `kind` without
  colliding with Patram structure.
