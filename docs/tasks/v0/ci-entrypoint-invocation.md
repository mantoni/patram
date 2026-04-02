# Use Local CI Entrypoint Invocation

- kind: task
- status: done
- tracked_in: docs/plans/v0/ci-entrypoint-invocation.md
- decided_by: docs/decisions/ci-entrypoint-invocation.md

- Invoke Patram repository checks through `./bin/patram.js check`.
- Keep package scripts and CI independent of globally installed bins.
