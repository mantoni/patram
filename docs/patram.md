# Patram

Patram is a CLI for exploring an entity-centric knowledge graph from ordinary
markdown, source code and HTML.

## Commands

The v0 CLI has two groups of commands:

1. Knowledge graph indexing and exploration
   - [`patram show <file>`](./reference/commands/show.md): Print a file with
     resolved links plus a compact incoming summary.
   - [`patram refs <file>`](./reference/commands/refs.md): Inspect incoming
     graph references for one file.
   - [`patram check [<path>...]`](./reference/commands/check.md): Validate a
     project, directory or file.

2. Field discovery
   - [`patram fields`](./reference/commands/fields.md): Discover likely field
     schema from source claims.

3. Querying
   - [`patram query <name>`](./reference/commands/query.md): Run a stored query
     by name.
   - [`patram query --cypher '<query>'`](./reference/commands/query.md): Run an
     ad hoc Cypher query.
   - [`patram query --where '<clause>'`](./reference/commands/query.md): Run a
     legacy ad hoc where clause.
   - [`patram queries`](./reference/commands/queries.md): List stored queries.

Package consumers can still parameterize legacy where-clause values with
explicit `@binding_name` placeholders through
`parseWhereClause(..., { bindings })` and `queryGraph(..., { bindings })`. The
CLI now treats Cypher as the primary ad hoc query syntax while keeping legacy
where clauses available for compatibility.

For repository documentation layout and where to put new docs, see
[`docs/structure.md`](./structure.md).

## Indexing

- Follows common practices.
- In markdown files:
  - The first line of the file is the title.
  - The first eligible paragraph becomes the description.
  - A pure directive block may appear between a heading title and the
    description paragraph.
  - Top-of-file front matter delimited by `---` is parsed as YAML.
  - A word or phrase that links with a relative path into a directory added to
    patram.
  - Defined keywords like `Defined by: <path-to-term-doc>`.
- In YAML files:
  - One `.yaml` or `.yml` file is one Patram document.
  - Top-level mapped scalars and approved scalar lists emit neutral directive
    claims.
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
patram query --cypher "MATCH (n:Plan) WHERE n.status = 'active' RETURN n"
patram query active-plans --explain
patram query --cypher "MATCH (n:Plan) WHERE n.status = 'active' AND NOT EXISTS { MATCH (decision:Decision)-[:TRACKED_IN]->(n) } RETURN n" --lint
patram show docs/conventions/worktracking-v0.md
patram refs docs/decisions/reverse-reference-inspection.md --cypher "MATCH (n:Document) RETURN n"
patram check docs
```

Recommended flow:

- Run `patram queries` first to see the repo's named entrypoints.
- Use `patram query <name>` for queue discovery and repeatable repo workflows.
- Use `patram query <name> --explain` when you want the resolved clause tree.
- Use `patram query --cypher '<query>' --lint` before saving a new ad hoc or
  stored query.
- Use `patram fields` when you want to inspect likely field schema before
  adopting it into config.
- Use `patram show <path>` after a query to read the matched document or source
  anchor in context.
- Use `patram refs <path>` when you need full incoming graph references for one
  matched document or source anchor.
- Use `patram check <path>` before handing off doc or code changes.

## Query Identities

- Unclassified documents use exact ids in the form `doc:<repo-relative-path>`.
- Document-backed entities promoted through structural `$class` and `$id`
  mappings use semantic ids such as `contract:release-flow`.
- Canonical command nodes use exact ids in the form `command:<name>`.
- Canonical term nodes use exact ids in the form `term:<name>`.

Examples:

```bash
patram query --cypher "MATCH (n) WHERE n.id = 'doc:docs/plans/v0/worktracking-agent-guidance.md' RETURN n"
patram query --cypher "MATCH (n) WHERE EXISTS { MATCH (n)-[:IMPLEMENTS_COMMAND]->(command:Command) WHERE command.id = 'command:query' } RETURN n"
patram query --cypher "MATCH (n) WHERE EXISTS { MATCH (n)-[:USES_TERM]->(term:Term) WHERE term.id = 'term:graph' } RETURN n"
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

Patram uses a semantic-first identity model for this repo:

- Keep unclassified source files path-backed as `doc:<path>`.
- Promote document-backed work items when structural mappings assign semantic
  `$class` and `$id`.
- Keep canonical source paths on promoted nodes as `$path`.
- Resolve path-based references through the canonical node for that document
  path.
- Keep command and term taxonomy nodes on semantic ids such as `command:query`
  and `term:claim`.
- Treat canonical reference docs as the source of truth for the promoted
  semantic nodes they define.

This direction is tracked in
[`docs/decisions/document-backed-semantic-ids.md`](./decisions/document-backed-semantic-ids.md),
[`docs/plans/v0/document-backed-semantic-ids.md`](./plans/v0/document-backed-semantic-ids.md),
and
[`docs/decisions/non-document-semantic-ids.md`](./decisions/non-document-semantic-ids.md).

[patram about-command=reference/commands/check.md]: #
[patram about-command=reference/commands/query.md]: #
[patram about-command=reference/commands/queries.md]: #
[patram about-command=reference/commands/refs.md]: #
[patram about-command=reference/commands/show.md]: #
