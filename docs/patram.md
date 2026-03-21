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

2. Querying
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

## Repo Taxonomy

This repo adds two custom kinds on top of Patram's built-in `document` kind:

- `command`: Canonical CLI command nodes backed by markdown files in
  `docs/reference/commands/`.
- `term`: Canonical graph vocabulary nodes backed by markdown files in
  `docs/reference/terms/`.

The repo also uses three relations to connect docs and source anchors to those
taxonomy nodes:

- `about_command`: A document explains one or more commands.
- `implements_command`: A source anchor implements one or more commands.
- `uses_term`: A document or source anchor depends on one or more core terms.

These nodes are path-backed in v0. The canonical markdown path is the node key,
so `docs/reference/commands/query.md` is the source of truth for the `query`
command node.

## Agent Workflow

Agents working in this repo should use the taxonomy queries first and then drill
into matching files with `show`.

```bash
patram query command-taxonomy
patram query command-implementations
patram query term-taxonomy
patram query term-usage
patram query --where "about_command:*"
patram show docs/patram.md
patram show lib/patram-cli.js
```

Typical uses:

- Start from `command-taxonomy` to find the canonical command docs.
- Use `command-implementations` to jump from command concepts to code
  entrypoints.
- Start from `term-taxonomy` to find the canonical vocabulary docs.
- Use `term-usage` to find docs and source anchors that depend on the core graph
  model.
- Use `about_command:*` as an ad hoc query when you want product-facing command
  docs rather than implementation files.

[patram about-command=reference/commands/check.md]: #
[patram about-command=reference/commands/query.md]: #
[patram about-command=reference/commands/queries.md]: #
[patram about-command=reference/commands/show.md]: #
