# YAML Source And Front Matter Proposal

- Kind: decision
- Status: accepted
- Tracked in: docs/plans/v0/yaml-source-and-front-matter.md

- Add `.yaml` and `.yml` as supported Patram source file extensions.
- Parse standalone YAML files and markdown front matter with the `yaml` npm
  package.
- Treat each YAML source file as exactly one Patram document.
- Keep markdown body metadata and hidden tags unchanged, but replace the
  front-matter scalar subset from
  `docs/decisions/markdown-metadata-directive-syntax.md` with YAML-backed
  parsing and projection.
- Require Patram-readable YAML metadata to parse as one top-level mapping.
- Extract Patram claims only from top-level mapping entries.
- Emit one neutral `directive` claim for each mapped top-level non-null scalar
  value.
- Emit repeated neutral `directive` claims for a mapped top-level sequence of
  non-null scalars only when the target mapping or field rule is explicitly
  multi-valued.
- Normalize emitted YAML scalar values to strings so the existing directive,
  validation, and materialization pipeline stays unchanged.
- Ignore top-level objects, nested structures, mixed sequences, and unmapped
  YAML content.
- Keep YAML metadata semantically aligned with existing markdown and JSDoc
  directives by mapping standalone YAML claims through `yaml.directive.<name>`
  and keeping markdown front matter on `markdown.directive.<name>`.
- Reuse the existing document title fallback behavior when no mapped title
  source materializes.
- Treat multi-document YAML input as invalid and report it through normal
  origin-aware diagnostics.
- Report invalid YAML syntax and non-mapping roots through normal origin-aware
  diagnostics instead of silently falling back.

## Example

```yaml
kind: decision
status: accepted
tracked_in:
  - docs/plans/v0/yaml-source-and-front-matter.md
summary: Add YAML source support.
extra:
  owner: team
```

```json
[
  {
    "type": "directive",
    "parser": "yaml",
    "name": "kind",
    "value": "decision"
  },
  {
    "type": "directive",
    "parser": "yaml",
    "name": "status",
    "value": "accepted"
  },
  {
    "type": "directive",
    "parser": "yaml",
    "name": "tracked_in",
    "value": "docs/plans/v0/yaml-source-and-front-matter.md"
  },
  {
    "type": "directive",
    "parser": "yaml",
    "name": "summary",
    "value": "Add YAML source support."
  }
]
```

## Front Matter Rules

- Front matter is still recognized only when the markdown file starts with
  `---`.
- Front matter still ends at the next line that is exactly `---`.
- The enclosed block is parsed as YAML instead of line-by-line scalar syntax.
- Front matter projection uses the same rules as standalone YAML files:
  top-level mapped scalars plus approved scalar lists, with objects and nested
  structures ignored.
- The first non-front-matter line remains the markdown title source.

## Rationale

- Real YAML parsing removes ad hoc front-matter edge cases and lets markdown
  front matter and standalone YAML files share one projection model.
- Top-level-only projection keeps Patram on its existing neutral claim model
  instead of turning YAML into a generic object-flattening language.
- Explicit multiplicity in config keeps repeated-claim behavior consistent with
  current repeated directives such as multiple `Tracked in:` or `Decided by:`
  lines.
- Rejecting malformed or multi-document YAML surfaces authoring mistakes early
  and preserves Patram's file-oriented document model.

## Consequences

- Parser dispatch must add a YAML branch alongside markdown and JSDoc.
- Source-file defaults and repo opt-in include patterns can now target `.yaml`
  and `.yml`.
- Repositories that want standalone YAML indexing must add mirrored
  `yaml.directive.*` mappings for the supported fields and relations.
- Markdown front matter gains YAML quoting, block scalar, and sequence syntax,
  but nested objects still do not materialize into Patram claims.
