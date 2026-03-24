# Patram

Patram is a CLI for exploring an entity-centric knowledge graph from ordinary
markdown, source code and HTML.

## Commands

The v0 CLI has two groups of commands:

1. Knowledge graph indexing and exploration
   - [`patram show <file>`](./reference/commands/show.md): Print a file with
     resolved links.
   - [`patram check [<path>]`](./reference/commands/check.md): Validate a
     project, directory or file.

2. Field discovery
   - [`patram fields`](./reference/commands/fields.md): Discover likely field
     schema from source claims.

3. Querying
   - [`patram query <name>`](./reference/commands/query.md): Run a stored query
     by name.
   - [`patram query --where "<clause>"`](./reference/commands/query.md): Run an
     ad hoc query.
   - [`patram queries`](./reference/commands/queries.md): List stored queries.

For repository documentation layout and where to put new docs, see
[`docs/structure.md`](./structure.md).

## Indexing

- Follows common practices.
- In markdown files:
  - The first line of the file is the title.
  - A word or phrase that links with a relative path into a directory added to
    patram.
  - Defined keywords like `Defined by: <path-to-term-doc>`.
- In HTML files:
  - The `<title>` tag defines the title.
- In source code comments:
  - A `@patram` tag adds a comment block to the index.
  - Use JSDoc `@link` and `@see` tags into a directory added to patram for
    references.

## Agent Workflow

Agents working in this repo should start from stored queries, then inspect
matching files with `show`, and then validate touched paths with `check`.

```bash
patram queries
patram query active-plans
patram query decision-review-queue
patram query decisions-needing-tasks
patram query ready-tasks
patram fields
patram query --where "tracked_in=doc:docs/plans/v0/worktracking-agent-guidance.md"
patram query active-plans --explain
patram query --where "$class=plan and none(in:tracked_in, $class=decision)" --lint
patram show docs/conventions/worktracking-v0.md
patram check docs
```

Recommended flow:

- Run `patram queries` first to see the repo's named entrypoints.
- Use `patram query <name>` for queue discovery and repeatable repo workflows.
- Use `patram query <name> --explain` when you want the resolved clause tree.
- Use `patram query --where "<clause>" --lint` before saving a new ad hoc or
  stored query.
- Use `patram fields` when you want to inspect likely field schema before
  adopting it into config.
- Use `patram show <path>` after a query to read the matched document or source
  anchor in context.
- Use `patram check <path>` before handing off doc or code changes.

## Query Identities

- Documents use exact ids in the form `doc:<repo-relative-path>`.
- Canonical command nodes use exact ids in the form `command:<name>`.
- Canonical term nodes use exact ids in the form `term:<name>`.

Examples:

```bash
patram query --where "tracked_in=doc:docs/plans/v0/worktracking-agent-guidance.md"
patram query --where "implements_command=command:query"
patram query --where "uses_term=term:graph"
```

## Stored Query Families

- Worktracking queries: `ideas`, `active-roadmaps`, `active-plans`,
  `plans-without-decisions`, `decision-review-queue`, `decisions-needing-tasks`,
  `pending-tasks`, `ready-tasks`, `in-progress-tasks`, `blocked-tasks`,
  `plans-with-open-tasks`, `decisions-with-open-tasks`.
- Taxonomy queries: `command-taxonomy`, `command-implementations`,
  `term-taxonomy`, `term-usage`.
- Source queries: `source-entrypoints`, `source-cli`, `source-config`,
  `source-scan`, `source-parse`, `source-graph`, `source-output`,
  `source-support`, `source-release`.

## Repo Taxonomy

This repo adds two canonical classes on top of Patram's built-in `document`
class:

- `command`: Canonical CLI command nodes backed by markdown files in
  `docs/reference/commands/`.
- `term`: Canonical graph vocabulary nodes backed by markdown files in
  `docs/reference/terms/`.

The repo also uses four relations to connect docs and source anchors to those
taxonomy nodes:

- `defines`: A canonical reference document defines one semantic entity.
- `about_command`: A document explains one or more commands.
- `implements_command`: A source anchor implements one or more commands.
- `uses_term`: A document or source anchor depends on one or more core terms.

Patram uses a hybrid identity model for this repo:

- Keep `document` nodes path-backed.
- Keep canonical reference markdown files as `document` nodes.
- Move non-document taxonomy nodes to semantic ids such as `command:query` and
  `term:claim`.
- Treat canonical command and term docs as the source of truth for those
  semantic nodes.
- Resolve path-based command and term references through the canonical defining
  documents.

This direction is tracked in
[`docs/decisions/non-document-semantic-ids.md`](./decisions/non-document-semantic-ids.md)
and
[`docs/plans/v0/non-document-semantic-ids.md`](./plans/v0/non-document-semantic-ids.md).

[patram about-command=reference/commands/check.md]: #
[patram about-command=reference/commands/query.md]: #
[patram about-command=reference/commands/queries.md]: #
[patram about-command=reference/commands/show.md]: #
