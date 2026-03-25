# Markdown Directive Style Validation Proposal

- Kind: decision
- Status: accepted
- Tracked in: docs/plans/v0/directive-type-validation.md

- Add optional markdown directive style rules to class schemas.
- Keep markdown parsing permissive and continue to recognize all supported
  markdown directive syntaxes.
- Enforce configured markdown directive styles only during `patram check`.
- Scope style rules per directive name, with an optional class-level default.
- Include hidden markdown tags in the same style policy as visible body
  directives and front matter.
- Add optional `mixed_styles` with values `ignore` and `error` to control
  whether one markdown document may mix directive styles.
- Keep graph mappings and directive value typing independent from style rules.

## Supported Markdown Styles

- `front_matter`
- `visible_line`
- `list_item`
- `hidden_tag`

These names describe the existing markdown directive syntaxes:

- `front_matter`: top-of-file `---` block with scalar `key: value` pairs
- `visible_line`: body line `Key: Value`
- `list_item`: body list item `- Key: Value`
- `hidden_tag`: markdown reference tag `[patram key=value]: #`

## Config Shape

Add optional markdown-style policy to class schemas and field rules in
`.patram.json`.

```json
{
  "classes": {
    "task": {
      "schema": {
        "markdown_styles": ["list_item"],
        "mixed_styles": "error",
        "fields": {
          "kind": {
            "presence": "required",
            "markdown_styles": ["front_matter", "list_item"]
          },
          "status": {
            "presence": "required",
            "markdown_styles": ["front_matter", "list_item"]
          },
          "tracked_in": {
            "presence": "required"
          },
          "decided_by": {
            "presence": "required",
            "multiple": true
          }
        }
      }
    }
  }
}
```

## Style Rules

- `classes.<class>.schema.markdown_styles` declares the default allowed markdown
  styles for directives in that class.
- `classes.<class>.schema.fields.<directive>.markdown_styles` overrides the
  class-level default for one normalized directive name.
- When no markdown style rule is configured at either level, current permissive
  behavior remains unchanged.
- Style rules apply only to markdown directives.
- JSDoc directives ignore markdown style rules.
- Hidden tags participate in the same style rule set as the other markdown
  directive forms.

## Mixed Styles

- `mixed_styles` is optional.
- Supported values are:
  - `ignore`
  - `error`
- Default `mixed_styles` to `ignore`.
- `mixed_styles=error` fails when one markdown document contains directives in
  more than one markdown style.
- `mixed_styles` is a document-level rule in addition to per-directive allowed
  styles.
- A repository may intentionally configure per-directive style allowances that
  still become invalid when combined under `mixed_styles=error`.

## Validation Phases

- Config-load validation checks:
  - `markdown_styles` arrays on class schemas and field rules
  - `mixed_styles`
  - empty arrays
  - unknown style names
- Content validation runs during `patram check`.
- Content validation includes:
  - directives whose markdown style is not allowed for that class or directive
  - documents that mix multiple markdown directive styles when
    `mixed_styles=error`
- `patram query`, `patram queries`, and `patram show` do not fail on markdown
  style content-validation errors.
- Invalid config still fails all commands.

## Diagnostics

Recommended diagnostic codes:

- `directive.invalid_style`
- `document.mixed_styles`

Diagnostic expectations:

- Invalid-style failures report at the directive origin.
- Mixed-style failures report at the directive origin that introduces the second
  distinct style.
- Diagnostics name the directive, the actual style, and the allowed style set or
  mixed-style policy.

## Claim Provenance

- Style validation requires Patram to preserve the markdown directive source
  style during checking.
- That style provenance is validation metadata and does not change how
  directives map into graph fields or relations.
- Style provenance does not change directive value typing.

## Compatibility

- This decision keeps current parser acceptance unchanged unless a repository
  opts into style rules.
- Repositories may adopt style enforcement gradually by class and by directive.
- Existing repositories that rely on mixed markdown directive styles continue to
  work until they configure enforcement.

## Rationale

- This preserves Patram's current adoption-friendly parser behavior while
  letting repositories tighten authoring conventions over time.
- Per-directive rules fit better than one document-wide style because singleton
  metadata and repeated relation directives often want different markdown
  surfaces.
- A separate `mixed_styles` switch lets repositories choose between flexible
  per-directive allowances and stricter document-level consistency.
- Keeping style checks in `patram check` matches the existing validation model
  for directive values, multiplicity, and placement.
