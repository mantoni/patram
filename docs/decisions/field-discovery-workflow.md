# Field Discovery Workflow Proposal

- Kind: decision
- Status: accepted

- Patram exposes field discovery through a dedicated `fields` command group.
- Discovery is separate from `patram check`.
- Discovery output is advisory only.
- Discovery may suggest:
  - field names
  - likely field types
  - likely multiplicity
  - likely class usage
- Discovery reports:
  - confidence
  - evidence references
  - conflicting evidence
- Discovery does not activate schema.
- Discovery must respect the reserved `$` namespace.
- Discovery must never suggest default hidden or display-order settings.

## Rationale

- Validation and discovery serve different purposes and should not share one
  diagnostic channel.
- Rich discovery output helps repos onboard existing documentation practices
  into the explicit field model.
- Confidence and conflict reporting help users judge which suggestions are safe
  to adopt first.

## Consequences

- Patram reserves `fields` as a top-level command group for field-model
  workflows.
- Discovery should support both human-readable and JSON output.
- Suggested schema always requires explicit adoption before it becomes valid
  config or query surface.
