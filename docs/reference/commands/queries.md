# Queries

- Command: queries
- Command Summary: List the stored queries defined in the project configuration.

`patram queries` prints the configured stored query names and their where
clauses. When a stored query defines a description, the command also renders an
indented description block with blank lines before and after it. Non-empty
output ends with a hint to `patram help query-language`.

Agents should usually start here, then pick a named workflow query and inspect
matching files with `patram show`.
