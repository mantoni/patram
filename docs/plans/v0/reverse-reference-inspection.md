# Reverse Reference Inspection Plan

- Kind: plan
- Status: active
- Tracked in: docs/roadmap/v0-dogfood.md
- Decided by: docs/decisions/reverse-reference-inspection.md
- Decided by: docs/decisions/show-output.md
- Decided by: docs/decisions/cli-output-architecture.md

## Goal

- Add one command that exposes full incoming references for one graph target.
- Make incoming references visible by default in `patram show` without
  sacrificing source-first inspection.
- Keep reverse lookup aligned with the existing graph and query model.

## Scope

- Add `patram refs <file>` on the shared CLI output pipeline.
- Resolve the target file through the canonical graph node identity before
  collecting incoming references.
- Filter incoming source nodes with the existing Patram `where` clause.
- Group reverse references by relation.
- Add a compact incoming summary to `patram show <file>`.
- Support `plain`, `rich`, and `json` output for `refs`.
- Keep v1 reverse lookup limited to relation-backed graph edges.
- Keep `show` counts-only for incoming summaries.
- Render the inspected node summary block before incoming `refs` groups.
- Reuse the same nested summary block shape for incoming `refs` nodes that
  `show` uses for node summaries.
- Defer reverse lookup over plain resolved markdown and JSDoc links.
- Defer configurable grouping such as `--group-by`.

## Output Sketch

```txt
patram show <file>
  source
  resolved links
  incoming summary

patram refs <file>
  relation
    node
```

```json
{
  "node": {
    "$id": "decision:trigger-driven-codex-runtime",
    "$path": "docs/decisions/runtime/trigger-driven-codex-runtime.md",
    "$class": "decision"
  },
  "incoming": {
    "decided_by": [
      {
        "$id": "doc:lib/reconcile.js",
        "$path": "lib/reconcile.js",
        "$class": "document",
        "title": "Reconciler entrypoint."
      }
    ]
  }
}
```

## Order

1. Add failing domain tests for collecting incoming graph edges for one target
   node, filtering the source nodes with a normal `where` clause, and grouping
   results by relation.
2. Add failing CLI parser and help tests for `refs`, including `--where`,
   `--plain`, and `--json`.
3. Implement a reverse-reference domain helper over `graph.edges` and
   `graph.nodes` that resolves one target node and returns grouped incoming
   data.
4. Add failing output-view and renderer tests for `refs` in `plain`, `rich`, and
   `json`.
5. Extend the shared output view model and renderers with one `refs` result
   shape.
6. Add failing `show` output tests for the compact incoming summary, including
   the empty-state case.
7. Extend `show` loading and output-view assembly to attach relation-first
   incoming summary counts after the resolved-link section.
8. Wire `refs` into CLI execution, graph loading, and diagnostics.
9. Update command docs and examples for `show`, `refs`, and repo agent guidance.
10. Run validation.

## Acceptance

- `patram refs <file>` lists incoming references grouped by relation.
- `patram refs <file> --where "$class=document"` filters incoming source nodes
  with the existing query language.
- `patram refs <file> --json` emits the documented relation-first grouped shape.
- `patram show <file>` keeps source-first rendering and adds a compact incoming
  summary.
- `show` incoming summaries use existing relation names only.
- Default reverse lookup excludes plain resolved markdown and JSDoc links that
  are not graph relations.
- `npm run all` passes.
