# Query Help Contract

- kind: decision
- status: accepted
- tracked_in: docs/plans/v0/query-help-contract.md
- decided_by: docs/decisions/query-language.md
- decided_by: docs/decisions/query-traversal-and-aggregation.md

- Document the shipped query language directly in `query --help`,
  `patram help query-language`, and the canonical query command reference.
- Keep help and reference copy aligned with the parser's supported forms instead
  of a higher-level feature summary.
- Keep `query --help` concise with representative syntax forms and examples.
- Keep `patram help query-language` as the authoritative CLI grammar surface for
  supported fields, relations, traversal terms, aggregates, and comparisons.

## Rationale

- Users need a stable contract at the prompt because the traversal and
  aggregation syntax already ships.
- The command help should be short enough for terminal use while still pointing
  to the exact grammar.
- The help topic and command reference should list the exact supported forms so
  docs do not drift from parser behavior.
