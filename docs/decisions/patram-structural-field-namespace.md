# Patram Structural Field Namespace Proposal

- Kind: decision
- Status: accepted

- Patram-owned structural fields use the reserved `$` prefix.
- Reserved Patram structural field names are:
  - `$id`
  - `$class`
  - `$path`
- Repo-defined metadata fields must not start with `$`.
- `title` is not a structural field.
- `title` is a well-known semantic field in the public field namespace.
- Patram always populates `title`.
- Title source precedence is:
  1. explicit `title` metadata
  2. parser-derived title from content
  3. deterministic fallback title
- The deterministic fallback title is synthesized from:
  1. `$path` basename when `$path` exists
  2. otherwise the key portion of `$id`

## Rationale

- Common names such as `id`, `class`, `path`, and `title` are likely to appear
  in existing docs and should remain available in the public metadata namespace.
- The `$` prefix keeps Patram-owned structure explicit without colliding with
  repo vocabulary.
- `title` is a semantic content property, not a structural graph field.

## Consequences

- Queries interpret `$`-prefixed fields using Patram core semantics only.
- Field discovery must never suggest repo-defined `$`-prefixed fields.
- Output and navigation can rely on `title` always being present, even for nodes
  with no explicit or extracted title.
