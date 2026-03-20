# CLI Output v0 Proposal

- Kind: convention
- Status: active

- Applies to the `plain`, `rich`, and `json` renderers.
- Defines the canonical plain-text baseline for `query`, `queries`, `check`, and
  `show`.
- Preserves the current `show` order of source first and resolved summary
  second.
- Documents canonical plain-text output examples only.
- Defines `rich` as a sibling renderer that preserves the canonical plain
  layout.

## Global Rules

- The documented examples in this file are `plain` output.
- `rich` mode must preserve the same line order, line breaks, numbering, and
  alignment as `plain`.
- `rich` and `plain` both render directly from the same structured output view
  model.
- Keep labels lowercase: `task`, `decision`, `doc`, `error`, `warning`.
- Use one shared metadata row format when metadata is shown:
  - `kind: <kind>  status: <status>`
- Do not rely on wrapping or color in `plain` mode.
- Keep diagnostic layout structurally aligned between `plain` and `rich` modes.

## Query

### Plain

```txt
document docs/tasks/v0/query-command.md
kind: task  status: pending

    Implement query command

document docs/decisions/query-language-v0.md
kind: decision  status: accepted

    Query Language v0
```

### JSON

```json
{
  "results": [
    {
      "id": "doc:docs/tasks/v0/query-command.md",
      "kind": "task",
      "title": "Implement query command",
      "path": "docs/tasks/v0/query-command.md",
      "status": "pending"
    },
    {
      "id": "doc:docs/decisions/query-language-v0.md",
      "kind": "decision",
      "title": "Query Language v0",
      "path": "docs/decisions/query-language-v0.md",
      "status": "accepted"
    }
  ]
}
```

### Empty

```txt
No matches.
Try: patram query --where "kind=task"
```

## Check

### Plain

```txt
docs/patram.md
  3:5  error  Document link target "docs/missing.md" was not found.  graph.link_broken

✖ 1 problem (1 error, 0 warnings)
```

### JSON

```json
{
  "diagnostics": [
    {
      "path": "docs/patram.md",
      "line": 3,
      "column": 5,
      "level": "error",
      "code": "graph.link_broken",
      "message": "Document link target \"docs/missing.md\" was not found."
    }
  ]
}
```

### Success

```txt
Check passed.
Scanned 12 files. Found 0 errors.
```

## Show

### Plain

```txt
# Patram

See [Some Guide][1].

----------------
[1] document docs/guide.md

    Some Guide
[2] document docs/decisions/query-language-v0.md
    kind: decision  status: accepted

    Query Language v0
[3] document docs/tasks/v0/query-command.md
    kind: task  status: pending

    Implement query command
```

### JSON

```json
{
  "source": "# Patram\n\nSee [guide](./guide.md), [query language](./query-language-v0.md), and [implement query command](./query-command.md).\n",
  "resolved_links": [
    {
      "reference": 1,
      "label": "Some Guide",
      "target": {
        "title": "Some Guide",
        "path": "docs/guide.md"
      }
    },
    {
      "reference": 2,
      "label": "Query Language v0",
      "target": {
        "title": "Query Language v0",
        "path": "docs/decisions/query-language-v0.md",
        "kind": "decision",
        "status": "accepted"
      }
    },
    {
      "reference": 3,
      "label": "Implement query command",
      "target": {
        "title": "Implement query command",
        "path": "docs/tasks/v0/query-command.md",
        "kind": "task",
        "status": "pending"
      }
    }
  ]
}
```

## Resolved Link Rendering

- Render inline references in prose as label-plus-reference tokens such as
  `[Some Guide][1]`.
- Keep reference numbering stable within one rendered document.
- Separate rendered prose from resolved references with an unlabeled divider.
- Prefer document titles over path-derived aliases for rendered link labels.
- Start each resolved-link footnote with the numbered reference token plus the
  identity header, such as `[1] document docs/guide.md`.
- Use `document` as the v0 header type for file-backed graph nodes.
- Render metadata immediately under the identity header when present.
- Leave one blank line between the metadata block and the indented content
  block.
- Always show the resolved target title in the indented content block.
- Show `kind`, `status`, and other target metadata only when present and useful.
- Treat resolved links as compact entity summaries, not path lookups.
- Render an indented description paragraph only when the resolved target carries
  one.

## Query Rendering

- Render each query result as an entity-summary block:
  - identity header
  - metadata row
  - indented content block
- Separate adjacent query results with one blank line.
- Render the identity header as `document <path>`.
- Render metadata immediately under the identity header when present.
- Leave one blank line between the metadata block and the indented content
  block.
- Render the title in the indented content block.
- Render an indented description paragraph only when the node carries one.
- Use the same metadata row shape as `show` footnotes.

## Error Writing

- Put the most actionable line last.
- Group repeated diagnostics by file in `rich` mode.
- Group repeated diagnostics by file in `plain` mode when multiple diagnostics
  share a file.
- End diagnostic output with a summary count line.
- Format diagnostic rows like eslint:
  - location column first
  - level column second
  - message column third
  - code column last
- Right-align the diagnostic code column when width allows.
- Rewrite expected failures for humans.
- Avoid log prefixes such as `ERR` and `WARN` in default output.

## Rich Rendering Rules

- Use one accent color for structure and links.
- Use red for errors and yellow for warnings.
- Use dim styling for paths, reference numbers, metadata keys, and `kind` and
  `status` metadata values.
- Make inline link labels clickable when the terminal supports hyperlinks.
- Render inline link references from `[Some Guide][1]` as `Some Guide 1` while
  preserving the same ordering and reference number.
- Expand plain dividers such as `----------------` into horizontal rules that
  span the available content width.
- Keep diagnostic tables identical to plain output and add color only.
- Keep footnotes identical to plain output and add color or hyperlinking only.
- Do not introduce indentation changes in `rich` mode that are not already
  present in `plain`.
- Do not generate `rich` output by parsing rendered `plain` text.

## Width

- Prefer 80 to 100 columns for the canonical layout.
- Keep metadata aligned after the primary label.
- Truncate only when wrapping would destroy scanability.
- Do not truncate paths in `plain` or `json` modes.
