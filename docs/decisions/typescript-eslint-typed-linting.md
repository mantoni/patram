# TypeScript ESLint Typed Linting Proposal

- kind: decision
- status: accepted
- tracked_in: docs/plans/v0/typescript-eslint-typed-linting.md

- Adopt the `typescript-eslint` flat-config package for repository linting.
- Downgrade `typescript` to a stable `5.x` release supported by
  `typescript-eslint`.
- Enable typed linting through `parserOptions.projectService`.
- Apply the recommended `typescript-eslint` flat configs for baseline and typed
  linting in addition to the existing repo rules.
- Keep one consistent typed rule set across the repo instead of file-specific
  rule carveouts.

## Rationale

- The repo already type-checks JavaScript with `tsc`, so typed ESLint rules can
  use the same project information once the repo TypeScript files are included
  in the same compiler project.
- The flat-config package is the recommended integration path for current
  `typescript-eslint`.
- Stable `typescript-eslint` currently peers with TypeScript `<6`, so staying on
  TypeScript `6` would keep the repo on an unsupported dependency combination.
- File-specific rule disablements hide real typing problems and make lint
  behavior depend on path-based exceptions instead of code quality.
- The documented recommended setup combines the baseline recommended preset with
  the typed recommended preset once project service is enabled.
