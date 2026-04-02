# Remove Compatibility Facades Proposal

- kind: decision
- status: accepted
- tracked_in: docs/plans/v0/remove-compatibility-facades.md

- Complete the source-layout migration by removing runtime and type modules
  whose only responsibility is to re-export another file.
- Treat the removal as a breaking change and stop preserving deep import
  compatibility for pre-migration module paths.
- Keep only intentional package entrypoints such as `lib/patram.js`,
  `lib/patram.d.ts`, and `bin/patram.js`.
- Update runtime imports, JSDoc type imports, package declaration generation,
  source-anchor docs, and tests to point at the concrete implementation files.
- Move tests that currently sit beside compatibility facades so they live next
  to the implementation they verify.
- Keep repo-level contract coverage in `test/`.

## Rationale

- The compatibility facade layer was useful during the directory migration, but
  it now duplicates nearly every learning path in `lib/` and hides the real
  implementation boundaries.
- Keeping both the facade and the implementation paths forces contributors and
  agents to guess which path is authoritative.
- Moving tests next to the real modules keeps future refactors local and makes
  it obvious which file owns the behavior.
- A breaking cleanup is simpler and more maintainable than preserving a second
  namespace indefinitely.
