# Single Config File v0 Proposal

- Kind: decision
- Status: accepted
- Tracked in: docs/roadmap/v0-dogfood.md

- Use one project config file for v0.
- Project config file name: `.patram.json`.
- `.patram.json` owns operational settings and graph schema.
- Operational settings include source globs and stored queries.
- Graph schema includes kinds, relations, and mappings.
- Do not introduce a second discovered schema config file in v0.

## Rationale

- One file keeps project setup easier to understand.
- One discovery path keeps CLI behavior predictable.
- Query, check, and show all depend on the same project semantics.
- A second config file would add coupling without helping v0 scope.
