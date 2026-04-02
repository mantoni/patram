# Declarative Derived Summaries

- kind: idea
- status: planned

- Make derived summaries declarative in config instead of hardcoding one
  worktracking model in product behavior.
- Keep the feature generic enough to support multiple graph and workflow models.

## Direction

- Let repositories declare derived summary definitions in config.
- Let those definitions describe which kinds they apply to, which traversals and
  aggregate queries they use, and which derived fields they emit.
- Keep `show` and `query` generic by rendering configured derived summaries
  instead of built-in worktracking-specific fields.

## Why

- Patram should support more than one workflow model.
- Config-defined summaries fit the broader direction of config-defined metadata
  rules and query behavior.
- A declarative summary model avoids baking repo-specific semantics into the
  core output pipeline.
