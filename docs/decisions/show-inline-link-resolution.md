# Show Inline Link Resolution

- kind: decision
- status: accepted
- tracked_in: docs/plans/v0/show-inline-link-resolution.md

- Preserve original markdown link syntax in human-facing `patram show <file>`
  source output.
- Stop appending resolved-link summary footers after the shown source in `plain`
  and `rich` output.
- For resolved links inside markdown list items, append one indented `->`
  summary block per link directly under that list entry.
- Render each list-item summary block header without a duplicated reference
  number, such as `-> document docs/guide.md`.
- For resolved links inside markdown prose, append stable footnote markers at
  the link site and place one footnote block per link at the end of the current
  section.
- Render each prose footnote block header with the markdown footnote token only,
  such as `[^1] document docs/guide.md`.
- Keep `show --json` emitting `source`, `incoming_summary`, and
  `resolved_links`.

## Rationale

- Rewriting markdown links to `[label][n]` changes the shown source more than
  needed and makes copy-paste less faithful to the file on disk.
- Inline list annotations keep resolved-link context close to the list entry
  that introduced it.
- Section-local prose footnotes preserve paragraph flow while avoiding one
  global footer that drifts far from the cited section.
- Keeping the JSON payload stable limits the contract change to human-facing
  rendering.
