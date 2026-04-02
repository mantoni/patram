# Patram v0 Graph

This document defines a simple v0 internal structure for patram.

Patram has built-in parsers for markdown, HTML and JSDoc-style source comments.
Those parsers emit neutral claims. Project-specific meaning comes from the
project JSON configuration in `.patram.json`.

## Layers

Patram has three layers:

1. `schema`: Defines the vocabulary used by a project.
2. `claims`: Raw parser output with exact source locations.
3. `graph`: Materialized nodes and edges after claims are mapped through the
   schema.

```mermaid
graph LR
  A["source file"] --> B["built-in parser"]
  B --> C["claim"]
  C --> D["schema mapping"]
  D --> E["graph"]
```

## Terms

- `kind`: A schema-defined category such as `term`, `concept` or `person`.
- `node`: A concrete graph object of some `kind`.
- `relation`: A schema-defined edge type such as `defines`, `mentions` or
  `links_to`.
- `claim`: A parser-produced fact before semantic mapping.

The schema is not part of the content graph. It defines the vocabulary the graph
uses and lives in the project config file.

## Design Constraints

- Built-in parsers should not hardcode project semantics.
- `Defined by:` has no built-in meaning until configured.
- Every extracted fact must keep an exact `origin`.
- Built-in behavior should stay minimal and stable.

## Built-In v0 Behavior

Patram should provide only a small built-in base:

- `document` kind
- `links_to` relation
- parsers for markdown, HTML and JSDoc
- path normalization
- origin tracking

Everything else should come from project configuration.

## Claims

Parsers emit neutral claims. Example claim types:

- `document.title`
- `markdown.link`
- `html.link`
- `jsdoc.link`
- `directive`

Example:

```json
{
  "id": "claim:1",
  "type": "directive",
  "parser": "markdown",
  "name": "defined_by",
  "document_id": "doc:docs/patram.md",
  "value": "terms/term.md",
  "origin": {
    "path": "docs/patram.md",
    "line": 12,
    "column": 1
  }
}
```

This does not mean anything until a mapping interprets it.

## Graph

The graph contains concrete nodes and edges.

Example:

```json
{
  "nodes": {
    "doc:docs/patram.md": {
      "id": "doc:docs/patram.md",
      "kind": "document",
      "path": "docs/patram.md",
      "title": "Patram"
    },
    "term:docs/patram.md": {
      "id": "term:docs/patram.md",
      "kind": "term",
      "key": "docs/patram.md",
      "path": "docs/patram.md",
      "label": "Patram"
    }
  },
  "edges": [
    {
      "id": "edge:1",
      "relation": "defines",
      "from": "doc:docs/patram.md",
      "to": "term:docs/patram.md",
      "origin": {
        "path": "docs/patram.md",
        "line": 1,
        "column": 1
      }
    }
  ]
}
```

## Identity

v0 should keep identity simple:

- `document` nodes are keyed by normalized relative path.
- Other nodes are keyed by `(kind, key)`.
- A non-document `key` can come from configuration or from the defining document
  path.

This avoids alias resolution and synonym handling in v0.

## Mapping

Mappings connect parser claims to graph semantics.

Example:

```json
{
  "mappings": {
    "markdown.link": {
      "relation": "links_to"
    },
    "markdown.directive.defined_by": {
      "emit": {
        "relation": "defines",
        "to_kind": "term",
        "target": "path"
      }
    }
  }
}
```

This means:

- plain markdown links materialize as `links_to`
- a markdown directive named `defined_by` materializes as a `defines` edge to a
  `term`

## V0 Non-Goals

- section-level nodes
- alias resolution
- transitive inference
- plugin parsers
- a configuration mini-language

v0 should prefer a small set of explicit mappings over rich inference.

- uses_term: reference/terms/claim.md
- uses_term: reference/terms/document.md
- uses_term: reference/terms/graph.md
- uses_term: reference/terms/kind.md
- uses_term: reference/terms/mapping.md
- uses_term: reference/terms/query.md
- uses_term: reference/terms/relation.md
