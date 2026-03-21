# Patram

Patram is a CLI for exploring an entity-centric knowledge graph from ordinary
markdown, source code and HTML.

The `patram` CLI has two groups of commands:

1. Knowledge graph indexing and exploration
   - [`patram show <file>`](./reference/commands/show.md): Print a file with
     resolved links.
   - [`patram check [<path>]`](./reference/commands/check.md): Validate a
     project, directory or file.

2. Querying
   - [`patram query <name>`](./reference/commands/query.md): Run a stored query
     by name.
   - [`patram query --where "<clause>"`](./reference/commands/query.md): Run an
     ad hoc query.
   - [`patram queries`](./reference/commands/queries.md): List stored queries.

For repository documentation layout and where to put new docs, see
`docs/structure.md`.

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

[patram about-command=reference/commands/check.md]: #
[patram about-command=reference/commands/query.md]: #
[patram about-command=reference/commands/queries.md]: #
[patram about-command=reference/commands/show.md]: #
