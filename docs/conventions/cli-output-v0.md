# CLI Output v0 Proposal

- Kind: convention
- Status: active

- Applies to the `plain`, `rich`, and `json` renderers.
- Defines the canonical plain-text baseline for `query`, `queries`, `check`, and
  `show`.
- Defers canonical `help` and usage-error copy to
  `docs/decisions/cli-help-copy-v0.md`.
- Preserves the current `show` order of source first and resolved summary
  second.
- `show` and `query` send rendered output through a pager in TTY mode.
- Documents canonical plain-text output examples only.
- Defines `rich` as a sibling renderer that preserves the canonical plain
  layout.
- Defers `show` rich source styling details to
  `docs/conventions/source-rendering-v0.md`.

## Global Rules

- The documented examples in this file are `plain` output.
- Root help, command help, help topics, and usage errors stay plain text only in
  v0.
- Use `docs/decisions/cli-help-copy-v0.md` as the canonical fixture source for
  `patram`, `patram help <target>`, and parse/usage error copy.
- `rich` mode must preserve the same line order, line breaks, numbering, and
  alignment as `plain`, except for the formatted source block in `show`.
- `rich` and `plain` both render directly from the same structured output view
  model.
- Keep labels lowercase: `task`, `decision`, `doc`, `error`, `warning`.
- Use one shared stored-metadata row format when metadata is shown:
  - document headers: `kind: <kind>  status: <status>`
  - semantic non-document headers: `path: <path>  status: <status>`
- When derived execution metadata is present, render one second metadata row:
  - `execution: <state>  open_tasks: <count>  blocked_tasks: <count>  total_tasks: <count>`
- Do not rely on wrapping or color in `plain` mode.
- Pager-backed TTY output uses `less -FIRXS`.
- Keep diagnostic layout structurally aligned between `plain` and `rich` modes.

## Query

### Plain

```txt
document docs/tasks/v0/query-command.md
kind: task  status: pending

    Implement query command

document docs/plans/v0/query-traversal-and-aggregation.md
kind: plan  status: active
execution: done  open_tasks: 0  blocked_tasks: 0  total_tasks: 4

    Query Traversal And Aggregation Plan

command command:query
path: docs/reference/commands/query.md

    query
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
      "id": "doc:docs/plans/v0/query-traversal-and-aggregation.md",
      "kind": "plan",
      "title": "Query Traversal And Aggregation Plan",
      "path": "docs/plans/v0/query-traversal-and-aggregation.md",
      "status": "active",
      "derived_summary": "plan_execution",
      "derived": {
        "execution": "done",
        "open_tasks": 0,
        "blocked_tasks": 0,
        "total_tasks": 4
      }
    }
  ],
  "summary": {
    "shown_count": 2,
    "total_count": 2,
    "offset": 0,
    "limit": 25
  },
  "hints": []
}
```

### Limited

```txt
document docs/tasks/v0/query-command.md
kind: task  status: pending

    Implement query command

document docs/plans/v0/query-traversal-and-aggregation.md
kind: plan  status: active
execution: done  open_tasks: 0  blocked_tasks: 0  total_tasks: 4

    Query Traversal And Aggregation Plan

...

Showing 25 of 40 matches.
Hint: use --offset <n> or --limit <n> to page through more matches.
```

### TTY Pager

```txt
document docs/tasks/v0/task-01.md
kind: task  status: pending

    Implement query command

document docs/plans/v0/query-traversal-and-aggregation.md
kind: plan  status: active
execution: done  open_tasks: 0  blocked_tasks: 0  total_tasks: 4

    Query Traversal And Aggregation Plan

...

document docs/tasks/v0/task-40.md
kind: task  status: pending

    Implement query command

Showing 40 of 40 matches.
```

### Empty

```txt
No matches.
Try: patram query --where "kind=task"
```

## Queries

### Plain

```txt
active-plans           kind=plan and status=active
decision-review-queue  kind=decision and status=proposed
ready-tasks            kind=task and status=ready
```

### JSON

```json
{
  "queries": [
    {
      "name": "active-plans",
      "where": "kind=plan and status=active"
    },
    {
      "name": "ready-tasks",
      "where": "kind=task and status=ready"
    }
  ]
}
```

### Empty

- Print no lines when no stored queries are defined.

## Check

### Plain

```txt
document docs/patram.md
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
# Query Traversal And Aggregation Plan

- Kind: plan
- Status: active
- Tracked in: docs/roadmap/query-language-extensions.md

See [Some Guide][1], [Query Language v0][2], and
[Implement query command][3].

----------------
document docs/plans/v0/query-traversal-and-aggregation.md
kind: plan  status: active
execution: done  open_tasks: 0  blocked_tasks: 0  total_tasks: 4

    Query Traversal And Aggregation Plan
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
  "document": {
    "title": "Query Traversal And Aggregation Plan",
    "path": "docs/plans/v0/query-traversal-and-aggregation.md",
    "kind": "plan",
    "status": "active",
    "derived_summary": "plan_execution",
    "derived": {
      "execution": "done",
      "open_tasks": 0,
      "blocked_tasks": 0,
      "total_tasks": 4
    }
  },
  "source": "# Query Traversal And Aggregation Plan\n\n- Kind: plan\n- Status: active\n- Tracked in: docs/roadmap/query-language-extensions.md\n\nSee [Some Guide](../guide.md), [Query Language v0](../decisions/query-language-v0.md), and [Implement query command](../tasks/v0/query-command.md).\n",
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
        "status": "accepted",
        "derived_summary": "decision_execution",
        "derived": {
          "execution": "done",
          "open_tasks": 0,
          "blocked_tasks": 0,
          "total_tasks": 4
        }
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
- When available, render the shown document's own entity summary first in the
  resolved summary section without a numeric footnote label.
- Prefer document titles over path-derived aliases for rendered link labels.
- Start each resolved-link footnote with the numbered reference token plus the
  identity header, such as `[1] document docs/guide.md`.
- Use `document` as the v0 header type for file-backed graph nodes.
- Render stored metadata immediately under the identity header when present.
- Render derived execution metadata on a second row when present.
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
- Render the identity header as `document <path>` for documents and
  `<kind> <id>` for semantic non-document nodes.
- Render stored metadata immediately under the identity header when present.
- Render derived execution metadata on a second row when present.
- Leave one blank line between the metadata block and the indented content
  block.
- Render the title in the indented content block.
- Render an indented description paragraph only when the node carries one.
- Use the same metadata row shape as `show` footnotes.
- Render the defining `path` in semantic non-document query results when it is
  known.
- Default query output to `25` results.
- Apply `--offset` and `--limit` after filtering and stable ordering.
- End paginated query output with `Showing <shown> of <total> matches.`.
- Omit the summary footer when `offset` is `0` and the visible page already
  includes every match.
- When the default limit hides more results and no pagination flags were set,
  render `Hint: use --offset <n> or --limit <n> to page through more matches.`.

## Stored Query Rendering

- Keep `queries` distinct from the entity-summary layout used by `query` and
  `show`.
- Render `queries` as two aligned columns:
  - stored query name
  - canonical rendered query term
- Do not use ASCII table borders or box-drawing characters.
- Keep stored queries in stable name order.
- Separate the name and term columns with at least two spaces.
- Compute the term column from the widest visible query name in the result set.
- Wrap only the query-term column when needed.
- Use a hanging indent under the query-term column for wrapped terms.
- Print no lines when no stored queries are defined in `plain` and `rich`
  output.
- Keep traversal and aggregate query clauses in their original string form:
  - `kind=plan and none(in:tracked_in, kind=task and status not in [done, dropped, superseded])`
  - `count(in:decided_by, kind=task) = 0`

## Query Inspection

- Keep `query --explain` separate from normal result rendering.
- Start explain output with:
  - `Query explanation`
  - the query source
  - the resolved `where` clause
  - the effective `offset` and `limit`
- Render explained clauses as a numbered tree.
- Render aggregates with separate `traversal`, optional `comparison`, and
  nested-clause lines.
- Keep `query --lint` success output short and diagnostic-free.
- Render `query --lint` failures with the same grouped diagnostic layout as
  `check`.

## Error Writing

- Put the most actionable line last.
- Render each diagnostic file group header as `{type} {path}`:
  - Use `document` for scanned source files.
  - Use `file` for non-indexed files such as `.patram.json`.
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

- Use green as the shared accent color for Patram node references:
  - `document <path>` headers in `query`, `show`, and `check`
  - stored query names in `queries`
- Use red for errors and yellow for warnings.
- Use gray for secondary structural text:
  - query hints such as `Try: ...`
  - plain dividers such as `----------------`
  - resolved-link reference numbers
  - diagnostic locations
  - diagnostic codes
  - the secondary success-summary line in `check`
- Keep metadata keys uncolored.
- Parse stored query terms before styling them.
- Keep stored query field names on the default foreground color.
- Use gray for stored query operators.
- Use yellow for stored query boolean keywords such as `and`, `or`, and `not`.
- Keep stored query literal values on the default foreground color.
- Keep diagnostic file group headers on the same accent color as entity-summary
  identity headers.
- Make inline link labels clickable when the terminal supports hyperlinks.
- Render inline link references from `[Some Guide][1]` as `Some Guide 1` while
  preserving the same ordering and reference number.
- Expand plain dividers such as `----------------` into horizontal rules that
  span the available content width.
- Keep diagnostic tables identical to plain output and add color only.
- Keep footnotes identical to plain output and add color or hyperlinking only.
- Keep `queries` column widths and wrapped line breaks identical to plain
  output.
- Do not introduce indentation changes in `rich` mode that are not already
  present in `plain`.
- Do not generate `rich` output by parsing rendered `plain` text.

## Width

- Prefer 80 to 100 columns for the canonical layout.
- Keep metadata aligned after the primary label.
- Truncate only when wrapping would destroy scanability.
- Do not truncate paths in `plain` or `json` modes.
