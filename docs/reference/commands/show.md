# Show

- command: show
- summary: Print one source file with indexed links resolved against the graph.

`patram show <file>` renders source text plus the resolved-link summaries for
the selected file. It keeps the source-first layout and appends a compact
incoming-reference summary labeled `incoming refs:` after the resolved-link
section when incoming graph relations exist, with one row per incoming relation.
