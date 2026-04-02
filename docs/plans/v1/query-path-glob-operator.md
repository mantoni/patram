# Query Path Glob Operator Plan

- Kind: plan
- Status: active
- Tracked in: docs/roadmap/query-language-extensions.md
- Decided by: docs/decisions/query-path-glob-operator.md

## Goal

- Add `$path*=<glob>` as a structural query term for matching repo-relative
  paths with glob expressions.

## Scope

- Where-clause parsing for `*=`.
- Semantic validation for `$path*=...`.
- Query execution support for path glob matching.
- Query help and command reference docs.
- Focused tests for parser, validator, executor, and help text.

## Order

1. Add failing tests for parsing, validation, execution, and help output.
2. Implement `*=` parsing and `$path`-only semantic support.
3. Evaluate `$path*=<glob>` with Node path glob semantics.
4. Update query help and reference docs.
5. Run repo validation and commit the change.

## Acceptance

- `$path*=docs/**/query-*.md` parses and executes successfully.
- `$path*=docs/**/query-*.md` matches file-backed nodes whose `$path` satisfies
  the glob.
- `$class*=task` fails semantic validation.
- Help and command reference docs list the `*=` operator and `$path`
  availability.
