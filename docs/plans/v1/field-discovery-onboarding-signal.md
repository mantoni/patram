# Field Discovery Onboarding Signal

- Kind: plan
- Status: active
- Tracked in: docs/roadmap/field-model-redesign.md
- Decided by: docs/decisions/field-discovery-workflow.md
- Decided by: docs/decisions/field-discovery-onboarding-signal.md

## Goal

- Refine `patram fields` so onboarding output favors likely document metadata
  over directive-shaped prose.

## Scope

- Ignore repo root-level source files during discovery.
- Restrict markdown discovery to front matter and the initial contiguous
  directive block after the title.
- Normalize evidence values before inferring likely field types.
- Filter structurally implausible field names without curated allow or deny
  lists.
- Update discovery tests and command-facing docs only as needed.

## Order

1. Add failing discovery tests for metadata-zone filtering, root-level file
   exclusion, normalized inference, and structural name filtering.
2. Update discovery scanning and inference helpers.
3. Validate touched docs and code paths.

## Acceptance

- Repo root-level files do not contribute discovery suggestions.
- Section-local directive-shaped prose does not produce field suggestions.
- Markdown link values can infer path-like types from their targets.
- Sentence-like normalized field names are excluded through structural rules.
