# Markdown Metadata Directive Syntax Proposal

- Kind: decision
- Status: accepted
- Tracked in: docs/plans/v0/markdown-metadata-directive-syntax.md

- Support multiple markdown syntaxes for the same neutral `directive` claim.
- Keep the existing list-item syntax: `- Key: Value`.
- Add visible single-line syntax: `Key: Value`.
- Add top-of-file front matter delimited by `---`.
- Add hidden markdown reference tags in the form `[patram key=value]: #`.
- Normalize directive names from spaces, hyphens, and mixed case to
  `lower_snake_case`.
- Keep directive values as strings in v0.
- Keep directive mappings in the existing `markdown.directive.<name>` namespace.
- Continue to ignore directives inside fenced code blocks.
- Derive the markdown title from the first non-front-matter line.

## Front Matter Rules

- Front matter is recognized only when the file starts with `---`.
- Front matter ends at the next line that is exactly `---`.
- Front matter accepts scalar `key: value` pairs only.
- Front matter does not support nested objects, arrays, multiline values, or
  quoting rules beyond keeping the raw scalar text.

## Body Directive Rules

- Visible body directives support `- Key: Value` and `Key: Value`.
- Visible body directives remain explicit metadata syntax and should use a
  leading capital letter.
- Arbitrary lowercase `key: value` prose lines in the body are not treated as
  directives.

## Hidden Tag Rules

- Hidden tags use one directive per line.
- Hidden tags use the literal `patram` marker to avoid collisions with ordinary
  markdown reference definitions.
- Hidden tags use `key=value` pairs with no quoting or escaping in v0.

## Multiplicity

- Repeated relation directives emit repeated claims.
- Repeated singleton fields such as `kind` and `status` remain valid; later
  materialization wins when mappings write the same node field.

## Rationale

- This keeps parser output stable because every supported syntax still emits the
  same neutral claim shape described in `docs/graph-v0.md`.
- Supporting multiple authoring styles makes Patram easier to adopt in existing
  markdown repositories.
- A small front-matter subset avoids bringing full YAML semantics into a v0
  parser.
- Requiring explicit visible body syntax avoids turning ordinary prose into
  metadata claims.
