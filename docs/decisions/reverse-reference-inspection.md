# Reverse Reference Inspection Proposal

- Kind: decision
- Status: accepted
- Tracked in: docs/plans/v0/reverse-reference-inspection.md

- Keep reverse reference inspection graph-native in v1.
- Add `patram refs <file>` for full incoming-reference inspection.
- Keep `patram show <file>` source-first and always append a compact incoming
  summary.
- Reuse the shared `plain`, `rich`, and `json` renderers for both surfaces.
- Group incoming references by relation.
- Reuse the existing `where` clause syntax unchanged for `patram refs --where`.
- Limit v1 reverse lookup to relation-backed graph edges.
- Defer reverse lookup over plain resolved markdown and JSDoc links to an opt-in
  follow-up.
- Show the inspected node summary at the top of `refs`.
- Reuse the same nested summary block shape for each incoming node in `refs`.
- Defer configurable grouping beyond the default relation-first layout.

## Semantics

- `patram show <file>` keeps the current source-first and resolved-links-second
  layout.
- `show` always renders an incoming summary block after the resolved-link
  section, even when no incoming graph edges match.
- The `show` incoming summary reports counts only.
- `show` groups incoming summary counts by relation.
- `patram refs <file>` resolves the target file to its graph node and lists
  incoming graph edges where that node is the target.
- `refs` filters incoming source nodes with the normal Patram `where` clause
  before grouping and rendering.
- `refs` uses the existing relation names directly and keeps node classes on the
  rendered node headers.
- `refs` does not introduce presentation buckets such as `source` or
  `documents`.
- `refs` plain and rich output begin with the inspected node summary block.
- `refs` JSON output mirrors the same relation-first hierarchy.

## Examples

`patram show docs/decisions/runtime/trigger-driven-codex-runtime.md`

```txt
decision docs/decisions/runtime/trigger-driven-codex-runtime.md
status: accepted
incoming:
  decided_by: 2
  implements: 1

Hint: patram refs docs/decisions/runtime/trigger-driven-codex-runtime.md
```

`patram refs docs/decisions/runtime/trigger-driven-codex-runtime.md`

```txt
decision docs/decisions/runtime/trigger-driven-codex-runtime.md
status: accepted

    Trigger Driven Codex Runtime

decided_by (2)
  document lib/reconcile.js
      Reconciler entrypoint.
  document lib/resume.js
      Resume entrypoint.

implements (1)
  task docs/tasks/runtime/add-reconcile-command.md
      Add reconcile command
```

`patram refs docs/decisions/runtime/trigger-driven-codex-runtime.md --where "$class=document"`

```txt
decision docs/decisions/runtime/trigger-driven-codex-runtime.md
status: accepted

    Trigger Driven Codex Runtime

decided_by (2)
  document lib/reconcile.js
      Reconciler entrypoint.
  document lib/resume.js
      Resume entrypoint.
```

## Rationale

- A compact incoming summary makes reverse references discoverable in the normal
  `show` flow without turning every read into a full graph dump.
- Relation-first grouping matches Patram's globally defined relation semantics
  and avoids repeating class buckets when every node header already shows its
  `$class`.
- A dedicated `refs` command gives reverse lookup room to grow without forcing
  `show` to absorb filtering and grouping concerns.
- Reusing the existing `where` clause keeps Patram on one query language instead
  of introducing a SQL-like or edge-specific variant.
- Limiting v1 to relation-backed graph edges keeps reverse lookup aligned with
  query semantics and architectural metadata instead of broad link scraping.
