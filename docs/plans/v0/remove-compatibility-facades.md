# Remove Compatibility Facades Plan

- kind: plan
- status: done
- decided_by: docs/decisions/remove-compatibility-facades.md

## Goal

- Remove re-export compatibility facades and make the implementation files the
  only supported internal module paths.

## Scope

- Delete pure re-export runtime and `.types.ts` facade modules under `lib/`.
- Rewrite internal imports, public package declaration references, and repo docs
  to target the concrete implementation paths.
- Move façade-targeted tests beside the implementation files they exercise.
- Update package metadata and smoke coverage for the reduced published file set.

## Order

1. Document the breaking cleanup decision and plan.
2. Change tests and docs to expect implementation paths instead of facades.
3. Rewrite imports and type references away from compatibility modules.
4. Delete the obsolete facade files.
5. Run targeted checks, then full validation, and finish with a commit.

## Acceptance

- No pure re-export compatibility facade remains under `lib/` except the
  supported package-root entrypoint files.
- Tests that directly exercise moved implementations live beside those
  implementation files.
- Source-anchor coverage and package smoke tests describe the implementation
  layout, not the removed facade layout.
- `npm run all` passes.
