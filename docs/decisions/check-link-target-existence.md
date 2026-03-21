# Check Link Target Existence Proposal

- Kind: decision
- Status: accepted
- Tracked in: docs/plans/v0/check-link-target-existence.md

- `patram check` validates path-like markdown link targets against repo file
  existence, not only indexed source files.
- Link target validation uses repo-relative paths after normalizing each target
  against the source document directory.
- Repo file existence checks respect the discovered project root and active
  `.gitignore` rules.
- Links that normalize outside the project root remain invalid.

## Rationale

- Repos often link from markdown to source files that Patram does not parse or
  index.
- Broken-link validation should answer whether a linked repo path exists, even
  when the target contributes no graph content.
- Keeping repo-root and `.gitignore` boundaries preserves the existing project
  scan semantics.
