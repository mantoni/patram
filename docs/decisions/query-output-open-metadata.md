# Query Output For Open Metadata Proposal

- Kind: decision
- Status: accepted

- Query JSON output exposes:
  - `$id`
  - `$class`
  - `$path` when present
  - `title`
  - `fields` for repo-defined metadata
- JSON output omits `$path` when it is missing.
- Show output and resolved-link output use the same structural-plus-fields
  split.
- Plain-text query output keeps a three-part layout:
  - structural header
  - visible metadata fields
  - indented `title`
- The structural header shows:
  - `$class`
  - `$path` when present
  - otherwise the key portion of `$id`
- Structural `$` fields are not repeated in the metadata line.
- The metadata line shows visible repo-defined fields by default.
- Repos may configure metadata fields as hidden from default plain output.
- Visible metadata fields use deterministic ordering:
  - explicit display order first
  - remaining visible fields in lexical order

## Rationale

- Structural fields and repo metadata have different roles and should render
  differently.
- Open-ended metadata should not force Patram to keep expanding a fixed output
  schema.
- The existing CLI scan pattern remains useful if structure, metadata, and title
  stay visually distinct.

## Example

```txt
document docs/plans/v1/example.md
status: ready_for_review  owner: agent  phase: delivery

    Example Plan
```
