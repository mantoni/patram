# Source Anchors v0 Proposal

- Kind: convention
- Status: active

- Applies to repo dogfooding source anchors only.
- Keeps source anchors query-first and intentionally sparse.
- Uses one activated JSDoc `@patram` block per tagged file.

## Anchor Block

```js
/**
 * Short search title.
 *
 * One short paragraph that explains responsibility and the boundary around the
 * file.
 *
 * Kind: parse
 * Status: active
 * Tracked in: ../docs/plans/v0/source-anchor-dogfooding.md
 * Decided by: ../docs/decisions/query-language.md
 * Implements: ../docs/tasks/v0/query-command.md
 * @patram
 * @see {@link ./neighbor-file.js}
 * @see {@link ../docs/patram.md}
 */
```

## Rules

- Keep the title short and use terms agents are likely to query: `query`,
  `show`, `check`, `graph`, `JSDoc`, `markdown`, `config`, `pager`.
- Keep `Kind:` values to: `entrypoint`, `cli`, `config`, `scan`, `parse`,
  `graph`, `output`, `support`, and `release`.
- Set `Status: active` on live source anchors.
- Add at least one doc link and one neighboring source link when a stable target
  exists.
- Prefer `Decided by:` and `Implements:` links over prose references.
- Do not tag leaf helpers only to mirror exports from an existing anchor.

## Coverage

- `bin/patram.js` covers CLI process entry.
- `lib/patram-cli.js` covers command execution flow and command wiring helpers.
- `lib/parse-cli-arguments.js` covers CLI parsing helpers and option parsing.
- `lib/load-patram-config.js` covers config schema and graph-config resolution.
- `lib/list-source-files.js` covers source scan defaults and repo file listing.
- `lib/load-project-graph.js` covers graph loading orchestration.
- `lib/parse-claims.js` covers source-type dispatch and claim helpers.
- `lib/parse-markdown-claims.js` covers markdown directive parsing helpers.
- `lib/parse-jsdoc-claims.js` covers JSDoc block parsing helpers.
- `lib/build-graph.js` covers graph node and edge materialization.
- `lib/query-graph.js` covers where-clause parsing and query matching.
- `lib/check-graph.js` covers graph validation diagnostics.
- `lib/show-document.js` covers resolved-link source rendering for `show`.
- `lib/render-output-view.js` covers plain, rich, and JSON output renderers.
- `lib/command-output.js` covers pager and TTY output helpers.
- `scripts/update-changelog.js` covers release automation and its test.
- `bin/` and `test/` behavior-test anchors cover command, repo, and package
  contracts that are not represented in `lib/`.
