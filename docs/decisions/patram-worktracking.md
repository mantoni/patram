# Patram Worktracking Proposal

- Kind: decision
- Status: accepted
- Tracked in: docs/plans/v0/patram-worktracking.md

- Model worktracking with `idea`, `roadmap`, `plan`, `decision`, and `task`
  documents.
- Keep `idea` documents lightweight and place them in `docs/research/`.
- Use `roadmap` documents to coordinate milestones, versions, or themes and to
  group plans.
- Use `plan` documents to describe one change and to track into one roadmap.
- Use `decision` documents to record resolved design choices and to track into
  one plan.
- Use `task` documents as atomic agent instructions and require each task to
  track into one plan and point to one or more decisions.
- Treat task status as the mutable implementation state.
- Derive decision implementation from the terminal state of the tasks that point
  to that decision instead of mutating the decision document.
- Derive plan implementation from the terminal state of the tasks that track
  into that plan instead of mutating the plan document.
- Defer roadmap implementation rollups until traversal and aggregation support
  is designed.

## Rationale

- This keeps the document graph hierarchical and avoids duplicating inverse
  relations across parent and child work items.
- Tasks are the only documents that should change routinely during execution.
- Derived implementation state reduces manual bookkeeping and stale parent
  status values.
- Roadmaps stay useful as coordination documents even before recursive rollups
  exist.
