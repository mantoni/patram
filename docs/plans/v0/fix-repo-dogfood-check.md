# Fix Repo Dogfood Check Plan

- kind: plan
- status: done
- tracked_in: docs/roadmap/v0-dogfood.md

## Goal

- Make `patram check` pass on this repo without weakening real broken-link
  diagnostics.

## Scope

- Document which markdown links become `markdown.link` claims.
- Ignore fenced example links and non-path targets during markdown claim
  parsing.
- Keep broken-link diagnostics for real repo markdown links.

## Order

1. Document the markdown-link claim scope for dogfooding.
2. Add failing tests for fenced examples, external URIs, and real broken links.
3. Update markdown claim parsing to follow the documented scope.
4. Run repo validation and mark the task complete.

## Acceptance

- Markdown links inside fenced code blocks do not produce `markdown.link`
  claims.
- External markdown links do not produce `markdown.link` claims.
- Fragment-only markdown links do not produce `markdown.link` claims.
- Real repo markdown links still produce broken-link diagnostics.
- `patram check` exits `0` in this repo.
