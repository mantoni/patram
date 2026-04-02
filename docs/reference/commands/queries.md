# Queries

- Command: queries
- Command Summary: List and manage the stored queries defined in the project
  configuration.

`patram queries` prints the configured stored query names and their where
clauses. When a stored query defines a description, the command also renders an
indented description block with blank lines before and after it. Non-empty
output ends with a hint to `patram help query-language`.

`patram queries add <name> --where "<clause>" [--desc "<text>"]` validates the
query and writes a new stored query into `.patram.json` without normalizing the
rest of the config file.

`patram queries update <name> [--name <new_name>] [--where "<clause>"] [--desc "<text>"]`
updates any combination of the stored query name, where clause, and description.
Passing `--desc ""` removes the stored query description.

`patram queries remove <name>` removes one stored query from `.patram.json`.
When `<name>` is not defined, `update` and `remove` reuse the same unknown
stored-query diagnostic as `patram query <name>`.

Agents should usually start here, then pick a named workflow query and inspect
matching files with `patram show`.
