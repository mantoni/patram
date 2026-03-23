# Repo Relative Directive Targets Proposal

- Kind: decision
- Status: accepted
- Tracked in: docs/plans/v0/fix-repo-relative-directive-targets.md

- Keep markdown and JSDoc link claims source-relative.
- For directive claims with `target: path`, prefer the raw target value when it
  exactly matches an indexed repo-relative document path.
- Otherwise, keep directive path-target resolution source-relative.
- Normalize the selected directive target path to repo-relative `/`-separated
  form before materializing nodes and edges.

## Rationale

- Repo worktracking metadata in this repository uses repo-relative directive
  values such as `docs/plans/...`.
- Blindly joining those directive values against the source document directory
  materializes bogus paths like `docs/decisions/docs/plans/...`.
- Limiting the new preference to directive claims preserves ordinary markdown
  link behavior, where `docs/...` is still interpreted relative to the source
  file unless written as `./docs/...` or `../docs/...`.
