# Repo Taxonomy Command And Term Nodes Proposal

- Kind: decision
- Status: superseded
- Tracked in: docs/roadmap/v0-dogfood.md
- Superseded by: docs/decisions/non-document-semantic-ids.md

- Add repo-specific `command` and `term` kinds for agent-facing exploration.
- Keep taxonomy nodes path-backed in v0 by using canonical markdown documents as
  the node keys.
- Limit v0 `command` nodes to implemented CLI commands: `check`, `query`,
  `queries`, and `show`.
- Keep unimplemented web server commands out of the v0 command taxonomy.
- Materialize command and term relations from markdown and JSDoc directives.
- Keep existing document metadata queries unchanged for work-item dogfooding.

## Rationale

- Agents need stable concept hubs that are separate from work-item document
  status.
- Canonical reference documents fit the existing `target: path` materialization
  model without adding a new key-resolution mechanism.
- Path-backed taxonomy nodes keep ids stable as long as the canonical reference
  paths stay stable.
- Restricting `command` to implemented v0 commands avoids graph noise from
  deferred product ideas.
