# Refs

- Command: refs
- Command Summary: Inspect incoming graph references for one file.

`patram refs <file>` renders the selected file's node summary and then lists
incoming graph references grouped by relation. Each incoming node uses the same
compact node summary fields as `query`, but incoming references render in a
tree-style block under each relation heading. Use `--cypher '<query>'` to filter
incoming source nodes with the supported Cypher subset.
