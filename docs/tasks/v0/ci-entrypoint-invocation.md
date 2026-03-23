# Use Local CI Entrypoint Invocation

- Kind: task
- Status: done
- Tracked in: docs/plans/v0/ci-entrypoint-invocation.md
- Decided by: docs/decisions/ci-entrypoint-invocation.md

- Invoke Patram repository checks through `./bin/patram.js check`.
- Keep package scripts and CI independent of globally installed bins.
