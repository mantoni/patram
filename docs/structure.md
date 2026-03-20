# Docs Structure Proposal

- `docs/patram.md`: Product definition.
- `docs/decisions/`: Decision records.
- `docs/roadmap/`: Implementation plans.
- `docs/conventions/`: Naming, config, graph, CLI, output conventions.
- `docs/research/`: Exploratory notes.

- One decision per file.
- One roadmap per milestone.
- One conventions file per topic or version.
- Prefer append-only decisions.
- Prefer short files.
- Prefer examples over prose.

```mermaid
graph TD
  A["docs/patram.md"]
  B["docs/decisions/"]
  C["docs/roadmap/"]
  D["docs/conventions/"]
  E["docs/research/"]

  A --> B
  A --> C
  A --> D
  A --> E
```
