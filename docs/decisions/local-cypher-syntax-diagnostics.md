# Local Cypher Syntax Diagnostics

- kind: decision
- status: accepted
- tracked_in: docs/plans/v0/local-cypher-syntax-diagnostics.md
- decided_by: docs/decisions/cypher-query-language.md

- Replace `@neo4j-cypher/language-support` with Patram's local tokenizer and
  parser diagnostics for supported Cypher queries.
- Keep the supported Cypher subset and execution model unchanged.
- Report syntax failures at the current parser token, or at end-of-input when
  parsing stops without another token.
- Remove schema projection code that only existed to feed the external
  validator.

## Rationale

- Patram already tokenizes and parses the supported Cypher subset locally before
  executing the query.
- The Neo4j language-support package only contributes fallback syntax messages;
  it does not participate in execution.
- Keeping syntax diagnostics local removes an avoidable runtime dependency and
  keeps parser behavior aligned with the subset Patram actually supports.
- This supersedes the syntax-validation dependency chosen in
  `docs/decisions/cypher-query-language.md`.
