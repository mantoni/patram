# Cypher Query Language Plan

- Kind: plan
- Status: active
- Tracked in: docs/roadmap/query-language-extensions.md
- Decided by: docs/decisions/cypher-query-language.md

## Goal

- Make Cypher the primary query syntax for Patram's `query` workflow.
- Preserve the current graph-building pipeline, document viewing, and CLI result
  rendering.

## Scope

- Add stored-query support for `cypher` text in `.patram.json`.
- Add ad hoc `--cypher` CLI support for `query`, `queries add`,
  `queries update`, and `refs`.
- Validate supported Cypher text with `@neo4j-cypher/language-support`.
- Translate the supported Cypher subset into the current Patram query executor.
- Migrate this repo's stored queries from `where` to `cypher`.
- Keep `where` support temporarily for compatibility during the migration.
- Update command help and reference docs from where-clause wording to Cypher
  wording.

## Supported Query Pattern

```cypher
MATCH (n:Plan)
WHERE n.status = 'active'
RETURN n
```

```cypher
MATCH (n:Decision)
WHERE n.status = 'accepted'
  AND COUNT {
    MATCH (task:Task)-[:DECIDED_BY]->(n)
  } = 0
RETURN n
```

## Order

1. Record the Cypher decision and plan.
2. Add failing tests for stored-query config, query resolution, Cypher
   translation, execution, and CLI help.
3. Add a constrained Cypher parser and translator that targets Patram's current
   execution model.
4. Wire stored queries, ad hoc queries, validation, inspection, and output
   through the new query path.
5. Migrate the repo config and docs to Cypher examples.
6. Run validation.

## Acceptance

- `patram query --cypher "MATCH (n:Plan) WHERE n.status = 'active' RETURN n"`
  returns the same nodes as the current `active-plans` stored query.
- Stored queries may be defined with `cypher` and listed or executed normally.
- `COUNT { ... }` and `EXISTS { ... }` patterns cover the current repo's
  worktracking and taxonomy queries.
- `query --lint` reports Cypher syntax errors against the new query text.
- `npm run all` passes.
