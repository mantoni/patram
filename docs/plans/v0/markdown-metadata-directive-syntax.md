# Markdown Metadata Directive Syntax Plan

- Kind: plan
- Status: active
- Tracked in: docs/roadmap/v0-dogfood.md
- Decided by: docs/decisions/markdown-metadata-directive-syntax.md

## Goal

- Expand markdown directive parsing beyond `- Key: Value` without changing graph
  mapping or claim materialization semantics.

## Scope

- Keep the neutral `directive` claim shape unchanged.
- Support visible directives as list items and plain lines.
- Support top-of-file front matter with scalar `key: value` pairs.
- Support hidden markdown reference tags in the form `[patram key=value]: #`.
- Preserve fenced-code exclusion for visible directives and hidden tags.
- Keep v0 values string-only and avoid full YAML parsing.

## Order

1. Add parser tests that fail for unsupported syntaxes and title handling after
   front matter.
2. Refactor markdown parsing to separate front-matter extraction from body
   scanning.
3. Add visible plain-line directive parsing alongside the existing list-item
   parser.
4. Add hidden-tag parsing for `[patram key=value]: #`.
5. Normalize directive names consistently across all supported syntaxes.
6. Run validation and mark the plan done after implementation lands.

## Acceptance

- A markdown file with front matter emits `directive` claims with exact origins.
- A markdown file with `Key: Value` body lines emits the same claims as
  `- Key: Value`.
- A markdown file with `[patram key=value]: #` emits the same directive claim
  name and string value as visible metadata.
- The first non-front-matter line remains the document title source.
- Directives inside fenced code blocks are ignored.
- Ordinary lowercase `key: value` prose lines in the body do not emit
  directives.
- Existing mappings such as `markdown.directive.kind` and
  `markdown.directive.tracked_in` continue to work unchanged.
