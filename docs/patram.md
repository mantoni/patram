# Patram

Patram is a CLI for exploring an entity-centric knowledge graph from ordinary
markdown, source code and HTML.

The `patram` CLI has three groups of commands:

1. Knowledge graph indexing and exploration
   - `patram show <file>`: Print a file with resolved links.

2. Configuration and knowledge graph validation
   - `patram check [<path>]`: Validate a project, directory or file.
   - `patram add ...`: TBD
   - `patram remove ...`: TBD
   - `patram define ...`: TBD

3. Local web application control
   - `patram start`: Start serving files from the current working directory.
   - `patram stop`: Stop serving.
   - `patram status`: Check if server is running.

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
