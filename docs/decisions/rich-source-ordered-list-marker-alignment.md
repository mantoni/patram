# Rich Source Ordered List Marker Alignment

- Kind: decision
- Status: accepted
- Tracked in: docs/plans/v0/fix-rich-source-ordered-list-marker-alignment.md

- Align ordered-list marker periods in rich `patram show` markdown output when
  one ordered list reaches double-digit item numbers.
- Left-pad shorter ordered-list numbers inside that list so `1.` through `9.`
  line up with `10.` and above.
- Keep unordered lists and `plain` and `json` `show` output unchanged.

## Rationale

- Double-digit ordered lists currently shift the marker period and the wrapped
  text start column once the list reaches `10.`
- The rich markdown renderer already owns list indentation, prefixes, and
  hanging indents, so it should keep ordered-list marker columns stable within
  one rendered list.
- Scoping the change to rich markdown output fixes the reported readability
  issue without broadening other `show` surfaces.
