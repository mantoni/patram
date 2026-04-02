# Patram Worktracking Plan

- kind: plan
- status: active
- tracked_in: docs/roadmap/v0-dogfood.md
- decided_by: docs/decisions/patram-worktracking.md

## Goal

- Define a repo-native worktracking workflow that uses `patram` documents and
  queries for ideas, roadmaps, plans, decisions, and tasks.
- Keep implementation progress derivable from task state instead of requiring
  parent documents to be updated as work completes.
- Document the validation requirements that future schema checks must enforce.

## Scope

- Define the worktracking terms and relations.
- Define the required metadata and allowed status values for each worktracking
  kind.
- Define how implementation state is derived from task documents.
- Treat roadmap rollups beyond direct task queries as deferred until traversal
  and aggregation are designed.
- Extend directive validation planning so the documented rules can be enforced
  later.

## Order

1. Record a worktracking decision that defines the hierarchy, status semantics,
   and derived-state rules.
2. Record a worktracking convention with terms, process, metadata rules, and
   examples.
3. Extend directive validation planning so the worktracking rules are
   enforceable.
4. Explore traversal and aggregation after the workflow model is settled.

## Acceptance

- The repo has one decision that defines the worktracking model.
- The repo has one convention that defines the process, terms, and metadata
  rules.
- The directive validation plan covers all constraints needed for that
  convention.
- Roadmap, plan, decision, and task roles are distinct and queryable.
