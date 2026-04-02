# Derived Summary Separate Row Plan

- kind: plan
- status: active
- tracked_in: docs/roadmap/query-language-extensions.md
- decided_by: docs/decisions/derived-summary-separate-row.md

## Goal

- Separate derived summary metadata from stored node metadata in compact output
  while keeping the shared entity-summary layout across `query`, `refs`, and
  `show`.

## Scope

- Keep direct node properties on the first compact title row.
- Render derived summary metadata on a second indented row labeled `summary:`.
- Update rich styling for the new summary row and for inline metadata
  punctuation.
- Update output conventions and examples to match the new layout.

## Work Breakdown

1. Add failing renderer tests for plain and rich output covering query results,
   refs node blocks, and show resolved-link footnotes with derived summaries.
2. Split stored metadata rows from derived summary rows in the shared output
   formatting helpers.
3. Render the derived summary row as `summary: key=value  ...` on a separate
   indented line in plain and rich output.
4. Update rich styling so inline metadata punctuation is gray and the `summary:`
   label is gray.
5. Refresh CLI output conventions and examples.
6. Run targeted validation and `npm run all`.

## Acceptance

- `query` shows direct node properties inline and derived summaries on a
  separate labeled row.
- `refs` uses the same summary-row layout for the inspected node and incoming
  nodes.
- `show` resolved-link footnotes use the same summary-row layout.
- Rich output keeps metadata content readable while de-emphasizing structural
  punctuation and the summary label.
