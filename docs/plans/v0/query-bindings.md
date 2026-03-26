# Query Bindings Plan

- Kind: plan
- Status: done
- Decided by: docs/decisions/query-bindings.md

## Goal

- Add a supported way to evaluate parameterized queries through the package
  query APIs without string substitution.

## Scope

- Add failing parser and query execution coverage for explicit bindings.
- Thread bindings through `parseWhereClause` and `queryGraph`.
- Cover the supported package API shape in the packed-package smoke test.
- Update the query docs to describe package-level binding support.

## Order

1. Document the query binding contract.
2. Add failing coverage for bound query parsing and evaluation.
3. Implement parser-aware value binding and query execution options.
4. Update public docs and package-consumer coverage.
5. Run validation and keep the plan marked done.

## Acceptance

- `parseWhereClause` accepts explicit bindings for value tokens.
- `queryGraph` accepts bindings together with pagination options.
- Bound relation targets are classified and validated with the same semantics as
  literal query text.
- Missing explicit bindings produce a query diagnostic.
- `npm run all` passes.
