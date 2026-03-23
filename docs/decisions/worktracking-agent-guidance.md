# Worktracking Agent Guidance Proposal

- Kind: decision
- Status: accepted
- Tracked in: docs/plans/v0/worktracking-agent-guidance.md

- Replace taxonomy-first agent onboarding with a worktracking-first `patram`
  workflow.
- Make stored queries reflect the active worktracking query model.
- Keep taxonomy and source queries as secondary navigation tools after queue
  discovery.
- Explain exact query target ids explicitly: documents use `doc:<path>`,
  commands use `command:<name>`, and terms use `term:<name>`.
- Teach agents to start with `patram queries`, inspect or debug clauses with
  `patram query --explain` and `patram query --lint`, inspect matched files with
  `patram show`, and validate changes with `patram check`.

## Rationale

- The active repo conventions are centered on ideas, plans, decisions, tasks,
  and changes, not on command and term taxonomy discovery alone.
- Stored query names should communicate workflow intent directly, especially for
  queue selection.
- Agents need an explicit explanation of id shapes to use exact relation-target
  queries confidently.
