# Remove overlayGraph API Proposal

- Kind: decision
- Status: accepted
- Tracked in: docs/plans/v0/remove-overlay-graph-api.md

- Remove `overlayGraph` from the supported package-root API and stop shipping
  `lib/graph/overlay-graph.js` as a maintained graph helper.
- Delete the helper implementation, its runtime coverage, and the package smoke
  assertions that depend on it.
- Remove the helper's plan and decision docs instead of keeping stale API
  guidance in the repo.
- Treat the removal as a breaking change with no backward compatibility layer
  and no migration documentation.

## Rationale

- The helper adds maintenance surface without serving an active consumer.
- Keeping an unused graph composition API makes the package look broader than
  the supported product behavior described in repo docs.
- A clean removal is smaller and easier to maintain than carrying a dead export
  indefinitely.
