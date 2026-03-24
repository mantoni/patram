# Fields

- Command: fields
- Command Summary: Discover likely metadata fields, multiplicity, and class
  usage from source claims.

`patram fields` scans source claims and reports advisory schema suggestions. It
does not validate or activate config.

Use `--json` for structured output, or `--plain` for readable text output.

Suggestions include:

- field name
- likely type
- likely multiplicity
- likely class usage
- confidence
- conflicting evidence
- evidence references

Examples:

- `patram fields`
- `patram fields --json`
