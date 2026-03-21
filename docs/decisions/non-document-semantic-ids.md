# Non-Document Semantic Ids Proposal

- Kind: decision
- Status: accepted
- Tracked in: docs/plans/v0/non-document-semantic-ids.md

- Keep `document` nodes path-backed.
- Add stable semantic ids for non-document nodes such as `command` and `term`.
- Treat canonical markdown files as documents that define those entities rather
  than as the entity ids themselves.
- Materialize command nodes as ids like `command:query`.
- Materialize term nodes as ids like `term:claim`.
- Keep canonical reference markdown files as the source of truth for entity
  fields and descriptions.
- Resolve path-based command and term references through the canonical defining
  documents so source anchors can keep linking to reference docs.
- Let `patram query` filter semantic ids directly.
- Show semantic ids and defining document paths together in query output.

## Rationale

- File paths are stable enough identities for documents but weak identities for
  concepts.
- Agents benefit from concept ids that do not change when docs move.
- Semantic ids make redirects, aliases, and multiple defining documents possible
  later.
- A hybrid model preserves the current document graph while giving taxonomy
  nodes a cleaner long-term identity.
