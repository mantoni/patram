# Optional Config Default Scan Plan

- kind: plan
- status: done
- tracked_in: docs/roadmap/v0-dogfood.md

## Goal

- Make Patram usable without `.patram.json`.
- Exclude ignored files automatically during source discovery.

## Scope

- Document optional config loading and built-in scan defaults.
- Add failing tests for missing-config success, missing-include fallback, and
  `.gitignore`-aware source discovery.
- Update source scanning to apply `.gitignore` rules while preserving stable
  repo-relative output.
- Keep graph-schema validation for config files that do define Patram schema.

## Order

1. Record the scanning and config defaults decision.
2. Add red tests for config fallback and `.gitignore` behavior.
3. Implement config defaults and `.gitignore`-aware discovery.
4. Run required validation, then mark the plan done.

## Acceptance

- `patram check` works in a directory with supported source files and no
  `.patram.json`.
- A config file may omit `include` and still scan supported source files.
- Files ignored by root or nested `.gitignore` files are not scanned.
- Negated `.gitignore` patterns can re-include paths inside scanned directories.
- Scan output remains sorted and repo-relative.
