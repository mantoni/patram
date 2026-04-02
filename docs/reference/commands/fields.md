# Fields

- command: fields
- summary: Discover likely metadata fields, multiplicity, inferred target types,
  and inferred document types from source claims.

`patram fields` scans source claims and reports advisory schema suggestions. It
does not validate or activate config.

Use `--json` for structured output, or `--plain` for readable text output. When
repo config defines metadata fields, `patram fields` omits those names from the
advisory suggestions. When `stdout` is a TTY, text output opens in the pager.

Discovery is optimized for onboarding signal:

- repo root-level files are ignored
- markdown discovery uses front matter plus the initial metadata block after the
  title
- type inference normalizes evidence values such as single markdown links before
  scoring

Suggestions include:

- field name
- likely type
- likely multiplicity
- likely `on` types
- likely `to` target type when the field looks like a reference
- confidence
- conflicting evidence
- evidence references

Text output shows up to 5 evidence rows per section and then summarizes the
remaining rows. JSON output keeps the complete evidence arrays.

Examples:

- `patram fields`
- `patram fields --json`
