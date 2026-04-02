# YAML Source And Front Matter Plan

- kind: plan
- status: done
- tracked_in: docs/roadmap/v0-dogfood.md
- decided_by: docs/decisions/yaml-source-and-front-matter.md

## Goal

- Add standalone YAML source support and upgrade markdown front matter to the
  same YAML-backed projection model without changing Patram's neutral directive
  claim shape or graph materialization pipeline.

## Scope

- Add `.yaml` and `.yml` to supported source file extensions.
- Parse standalone YAML files as single-document metadata sources.
- Replace markdown front-matter line parsing with YAML parsing between the
  existing `---` delimiters.
- Project only top-level mapped scalars and explicitly allowed scalar lists into
  neutral directive claims.
- Keep nested objects, mixed sequences, and other unmapped YAML structures out
  of Patram claim extraction.
- Add normal diagnostics for invalid YAML syntax, non-mapping roots, and
  multi-document YAML input.
- Mirror supported YAML fields and relations through `yaml.directive.*`
  mappings.
- Add targeted repo fixtures and config coverage without broadly indexing
  unrelated workflow YAML in this repo.

## Order

1. Add failing parser tests for standalone YAML claims, markdown front matter
   YAML projection, scalar-list multiplicity, ignored nested structures, and
   YAML diagnostics.
2. Add failing config and repo tests for `yaml.directive.*` mappings and YAML
   source extension support.
3. Install `yaml` and add a shared YAML projection helper that converts parsed
   YAML metadata into neutral directive claim fields.
4. Extend source-file defaults and parse dispatch for `.yaml` and `.yml`.
5. Upgrade markdown front matter parsing to use the shared YAML projection
   helper while keeping body directive and hidden-tag behavior unchanged.
6. Update repo config, fixtures, and rendering expectations for YAML-backed
   claims.
7. Run validation and mark the plan done after the feature and repo coverage
   land.

## Acceptance

- A standalone `.yaml` or `.yml` file with a top-level mapping emits the same
  graph semantics as equivalent markdown or JSDoc directives.
- Markdown front matter supports YAML strings, quoted scalars, block scalars,
  and scalar lists under the same top-level projection rules as standalone YAML
  files.
- A mapped top-level scalar emits one directive claim.
- A mapped top-level scalar list emits repeated directive claims only when the
  target mapping or field rule is explicitly multi-valued.
- Nested YAML objects, nested sequences, mixed sequences, and unmapped keys do
  not emit derived claims.
- Invalid YAML syntax, multi-document input, and non-mapping roots surface
  diagnostics with source origins.
- Existing markdown body directives, hidden tags, JSDoc directives, and graph
  materialization behavior remain unchanged.
- `npm run all` passes.
