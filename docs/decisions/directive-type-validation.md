# Directive Type Validation Proposal

- Kind: decision
- Status: accepted
- Tracked in: docs/plans/v0/directive-type-validation.md

- Add optional top-level `directive_types` to `.patram.json` for value typing of
  named directives.
- Add optional top-level `metadata_schemas` to `.patram.json` for per-kind
  directive rules.
- Add optional top-level `path_classes` to `.patram.json` for reusable
  repo-relative path classes.
- Keep markdown and JSDoc directive parsing string-valued and unchanged.
- Validate config structure and internal references at config-load time.
- Validate directive values, multiplicity, path classes, and placement during
  `patram check`.
- Use the same diagnostic report UI contract for all validation output across
  commands.

## Config Shape

```json
{
  "directive_types": {
    "status": {
      "type": "string"
    },
    "tracked_in": {
      "type": "path"
    }
  },
  "path_classes": {
    "plan_docs": {
      "prefixes": ["docs/plans/"]
    },
    "decision_docs": {
      "prefixes": ["docs/decisions/"]
    }
  },
  "metadata_schemas": {
    "task": {
      "unknown_directives": "ignore",
      "document_path_class": "task_docs",
      "directives": {
        "status": {
          "presence": "required"
        },
        "tracked_in": {
          "presence": "required",
          "type": {
            "type": "path",
            "path_class": "plan_docs"
          }
        },
        "decided_by": {
          "presence": "required",
          "multiple": true,
          "type": {
            "type": "path",
            "path_class": "decision_docs"
          }
        },
        "execution": {
          "presence": "forbidden"
        }
      }
    }
  }
}
```

## Directive Types

- Support these directive value types in v0:
  - `string`
  - `integer`
  - `enum`
  - `path`
  - `glob`
  - `date`
  - `date_time`
- `string` accepts any non-empty directive string value.
- `integer` accepts base-10 whole numbers only.
- `enum` accepts only configured exact values.
- `path` accepts non-empty path-like strings and may additionally reference a
  `path_class`.
- `glob` accepts non-empty glob-like strings.
- `date` uses ISO calendar date format `YYYY-MM-DD`.
- `date_time` uses timezone-naive `YYYY-MM-DD HH:MM`.
- `date` and `date_time` values must be real calendar values.
- `date_time` does not support seconds, offsets, or `T` separators in v0.

## Path Classes

- `path_classes` is keyed by stable class names such as `plan_docs`.
- Each path class declares one-or-more repo-relative `prefixes`.
- A `path` type definition may optionally declare `path_class`.
- `path_class` is valid only on `type: "path"`.
- Path-class validation uses the normalized repo-relative path that Patram
  already resolves for directive path targets.
- A path passes a path class when it starts with one of that class's prefixes.

## Kind Schemas

- `metadata_schemas` is keyed by effective document kind.
- A kind schema may declare `document_path_class` for source-document placement.
- A kind schema declares its directive policy in `directives`, keyed by
  normalized directive name.
- Each directive rule declares `presence` as one of:
  - `required`
  - `optional`
  - `forbidden`
- `multiple: true` changes multiplicity:
  - `required` plus `multiple: true` means one-or-more
  - `optional` plus `multiple: true` means zero-or-more
- `required` without `multiple` means exactly one.
- `optional` without `multiple` means zero-or-one.
- `forbidden` always means zero.
- A directive rule may declare a kind-local `type` override using the same type
  shape as top-level `directive_types`.

## Unknown Directives

- A kind schema may declare `unknown_directives`.
- Supported values in the first pass are:
  - `ignore`
  - `error`
- Default `unknown_directives` to `ignore`.
- `unknown_directives` controls directives not listed in the kind schema's
  `directives` object.
- Top-level `directive_types` still apply to covered directive names even when a
  kind schema does not list them.

## Placement Rules

- `document_path_class` references one configured `path_classes` entry.
- When present, the source document's repo-relative path must start with one of
  that class's prefixes.
- Placement rules apply to markdown documents and JSDoc-backed source files.
- Path-class validation for directive targets and placement validation for the
  source document are separate checks.

## Validation Phases

- Config-load validation checks:
  - `directive_types`
  - `metadata_schemas`
  - `path_classes`
  - internal references between those sections
  - contradictory schema declarations
- Config-load failures report against `.patram.json`.
- Content validation runs during `patram check`.
- Content validation includes:
  - invalid directive values
  - missing required directives
  - forbidden directives
  - multiplicity violations
  - invalid directive target path classes
  - invalid document placement
- `patram query`, `patram queries`, and `patram show` do not fail on
  content-validation errors in v0.
- All commands do fail on invalid config.

## Diagnostics

- All validation diagnostics use the same diagnostic report UI contract.
- `patram check` already satisfies this contract.
- Other commands that surface validation failures must align to the same
  renderer and output contract.
- Directive-value failures report the directive origin.
- Missing-required and placement failures report at file `1:1`.
- JSON output uses the same diagnostic object shape across commands.

Recommended diagnostic codes:

- `config.invalid`
- `directive.invalid_type`
- `directive.invalid_enum`
- `directive.missing_required`
- `directive.forbidden`
- `directive.duplicate`
- `directive.invalid_path_class`
- `document.invalid_placement`

## Compatibility

- This decision does not preserve backward compatibility guarantees for v0.
- Repositories may adopt typed validation incrementally by kind and directive.
- Graph mappings remain separate from validation rules and do not implicitly
  define validation policy.

## Rationale

- Separate `directive_types`, `metadata_schemas`, and `path_classes` keep value
  typing, kind policy, and repo path classes independent and easy to validate.
- Directive-keyed kind schemas keep all rules for one directive in one place and
  avoid contradictions across parallel lists.
- Reusing path classes for both directive targets and document placement avoids
  a second path-policy mechanism.
- Keeping content validation in `patram check` preserves the explicit role of
  the check command while still making config validity a prerequisite for all
  commands.
- One validation UI contract keeps diagnostics consistent for humans and
  automation.
