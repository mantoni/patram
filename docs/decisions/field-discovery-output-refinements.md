# Field Discovery Output Refinements Proposal

- kind: decision
- status: accepted
- tracked_in: docs/plans/v1/field-discovery-output-refinements.md

- `patram fields` does not report schema names that are already defined in repo
  config, including metadata fields and relations.
- `patram fields` uses the interactive pager when `stdout` is a TTY, matching
  `patram show` and `patram query`.
- Plain and rich field discovery output renders at most 5 evidence rows per
  evidence section and then prints a summary line for the remaining rows.
- JSON field discovery output keeps the full evidence arrays.

## Rationale

- Discovery should focus on schema gaps instead of repeating metadata fields or
  relations the repo has already adopted.
- Interactive discovery output benefits from the same pager behavior as other
  long-form exploration commands.
- Capping text evidence keeps discovery readable while preserving complete data
  in JSON.
