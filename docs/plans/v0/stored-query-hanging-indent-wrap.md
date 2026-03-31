# Stored Query Hanging Indent Wrap Plan

- Kind: plan
- Status: active
- Tracked in: docs/roadmap/v0-dogfood.md
- Decided by: docs/decisions/stored-query-hanging-indent-wrap.md

## Goal

- Fix `patram queries` so wrapped stored-query clauses align under the first
  character of the first-line clause instead of resetting to a two-space indent.

## Scope

- Update the stored-query terminal output convention for hanging-indent wraps.
- Add failing test updates for the wrapped `queries` layout.
- Adjust only the stored-query block formatter and keep `query`, `refs`, and
  JSON output unchanged.

## Order

1. Update the convention and record the wrapping decision.
2. Add failing test updates for hanging-indent wraps.
3. Adjust the shared stored-query block formatter.
4. Run the required validation and commit as a fixup.

## Acceptance

- `patram queries` still renders `<name>  <query>` on the first row.
- Wrapped query clause lines align under the first query character in TTY
  output.
- Description body rows remain indented by two spaces.
- `plain` and `rich` keep identical line breaks.
- `npm run all` passes.
