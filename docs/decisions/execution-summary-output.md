# Execution Summary Output Proposal

- kind: decision
- status: accepted
- tracked_in: docs/plans/v0/execution-summary-output.md

- Show derived execution summaries for `decision`, `plan`, and `roadmap`
  documents in `query` results.
- Add a self-summary block for the shown document in `show` output between the
  source block and resolved-link summaries.
- Keep stored lifecycle metadata such as `status: active` distinct from derived
  execution metadata such as `execution: done`.
- Render derived execution metadata on a second metadata row when it is present.
- Use the derived fields `execution`, `open_tasks`, `blocked_tasks`, and
  `total_tasks`.
- Do not render derived execution summaries for `task` or `idea` documents in
  the first pass.
- Add a `derived` object to JSON node summaries when execution metadata is
  present.

## Derived State Semantics

- `done`: `total_tasks > 0` and `open_tasks = 0`.
- `not_started`: `total_tasks = 0` or every related task is `pending`.
- `blocked`: `open_tasks > 0` and every open task is `blocked`.
- `in_progress`: any other non-terminal state mix.

## Rationale

- Users need to see execution progress without overloading the stored `status`
  field.
- A second metadata row keeps lifecycle and derived execution facts visually
  distinct.
- Showing the inspected document's own summary in `show` makes worktracking
  documents self-describing at the CLI.
