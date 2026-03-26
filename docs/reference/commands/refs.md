# Refs

- Command: refs
- Command Summary: Inspect incoming graph references for one file.

`patram refs <file>` renders the selected file's node summary and then lists
incoming graph references grouped by relation. Each incoming node uses the same
nested summary block shape used in `show`. Use `--where "<clause>"` to filter
incoming source nodes with the normal Patram query language.
