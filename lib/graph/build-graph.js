/* eslint-disable max-lines */
/**
 * @import { BuildGraphResult, GraphEdge, GraphNode } from './build-graph.types.ts';
 * @import { PatramClaim } from '../parse/parse-claims.types.ts';
 * @import { MetadataFieldConfig } from '../config/load-patram-config.types.ts';
 * @import { MappingDefinition, PatramConfig } from '../config/patram-config.types.ts';
 */

import { posix } from 'node:path';

import {
  collectDocumentEntityKeys,
  collectDocumentNodeReferences,
  normalizeRepoRelativePath,
  resolveNodeKey,
  resolveTargetReference,
  setCanonicalPath,
} from './build-graph-identity.js';

/**
 * Claim-to-graph materialization.
 *
 * Maps parsed claims into document nodes and relations using the resolved
 * Patram graph config.
 *
 * Kind: graph
 * Status: active
 * Uses Term: ../../docs/reference/terms/claim.md
 * Uses Term: ../../docs/reference/terms/document.md
 * Uses Term: ../../docs/reference/terms/graph.md
 * Uses Term: ../../docs/reference/terms/mapping.md
 * Uses Term: ../../docs/reference/terms/relation.md
 * Tracked in: ../../docs/plans/v0/source-anchor-dogfooding.md
 * Decided by: ../../docs/decisions/graph-materialization.md
 * Implements: ../../docs/tasks/v0/materialize-graph.md
 * @patram
 * @see {@link ./load-project-graph.js}
 * @see {@link ../../docs/decisions/graph-materialization.md}
 */

const STRUCTURAL_FIELD_NAMES = new Set(['$class', '$id', '$path']);
const DETERMINISTIC_LOCALE = 'en';
const DERIVED_TITLE_PRIORITY = 1;
const EXPLICIT_TITLE_PRIORITY = 2;

/**
 * Build a Patram graph from semantic config and parsed claims.
 *
 * @param {PatramConfig} patram_config
 * @param {PatramClaim[]} claims
 * @returns {BuildGraphResult}
 */
export function buildGraph(patram_config, claims) {
  /** @type {Map<string, GraphNode>} */
  const graph_nodes = new Map();
  const document_node_references = collectDocumentNodeReferences(
    patram_config.mappings,
    claims,
  );
  const document_entity_keys = collectDocumentEntityKeys(
    patram_config.mappings,
    claims,
  );
  /** @type {Set<string>} */
  const document_paths = new Set(
    claims.map((claim) => normalizeRepoRelativePath(claim.origin.path)),
  );
  /** @type {Map<string, number>} */
  const title_priorities = new Map();

  createDocumentNodes(graph_nodes, document_node_references);
  applyNodeMappings(
    graph_nodes,
    patram_config,
    claims,
    document_entity_keys,
    document_node_references,
    title_priorities,
  );
  const graph_edges = createGraphEdges(
    graph_nodes,
    patram_config.mappings,
    claims,
    document_entity_keys,
    document_node_references,
    document_paths,
  );
  applyFallbackTitles(graph_nodes, title_priorities);

  const graph_result = {
    edges: graph_edges,
    nodes: Object.fromEntries(
      [...graph_nodes.entries()].sort(compareNodeEntries),
    ),
  };

  attachDocumentNodeAliases(graph_result.nodes, document_node_references);
  Object.defineProperty(
    graph_result,
    'document_node_ids',
    createDocumentNodeIdsProperty(document_node_references),
  );

  return graph_result;
}

/**
 * @param {Record<string, MappingDefinition>} mappings
 * @param {PatramClaim} claim
 * @returns {MappingDefinition | null}
 */
function resolveMappingDefinition(mappings, claim) {
  if (claim.type === 'directive') {
    return resolveDirectiveMapping(mappings, claim);
  }

  return mappings[claim.type] ?? null;
}

/**
 * @param {Record<string, MappingDefinition>} mappings
 * @param {PatramClaim} claim
 * @returns {MappingDefinition | null}
 */
function resolveDirectiveMapping(mappings, claim) {
  if (!claim.parser || !claim.name) {
    return null;
  }

  return mappings[`${claim.parser}.directive.${claim.name}`] ?? null;
}

/**
 * @param {Map<string, GraphNode>} graph_nodes
 * @param {Map<string, import('./document-node-identity.js').DocumentNodeReference>} document_node_references
 */
function createDocumentNodes(graph_nodes, document_node_references) {
  for (const document_node_reference of document_node_references.values()) {
    const graph_node = upsertNode(
      graph_nodes,
      document_node_reference.class_name,
      document_node_reference.key,
    );

    setCanonicalPath(graph_node, document_node_reference.path);
  }
}

/**
 * @param {Map<string, GraphNode>} graph_nodes
 * @param {PatramConfig} patram_config
 * @param {PatramClaim[]} claims
 * @param {Map<string, string>} document_entity_keys
 * @param {Map<string, import('./document-node-identity.js').DocumentNodeReference>} document_node_references
 * @param {Map<string, number>} title_priorities
 */
function applyNodeMappings(
  graph_nodes,
  patram_config,
  claims,
  document_entity_keys,
  document_node_references,
  title_priorities,
) {
  for (const claim of claims) {
    const mapping_definition = resolveMappingDefinition(
      patram_config.mappings,
      claim,
    );

    if (!mapping_definition?.node) {
      continue;
    }

    applyNodeMapping(
      graph_nodes,
      patram_config,
      mapping_definition.node,
      claim,
      document_entity_keys,
      document_node_references,
      title_priorities,
    );
  }
}

/**
 * @param {Map<string, GraphNode>} graph_nodes
 * @param {Record<string, MappingDefinition>} mappings
 * @param {PatramClaim[]} claims
 * @param {Map<string, string>} document_entity_keys
 * @param {Map<string, import('./document-node-identity.js').DocumentNodeReference>} document_node_references
 * @param {Set<string>} document_paths
 * @returns {GraphEdge[]}
 */
function createGraphEdges(
  graph_nodes,
  mappings,
  claims,
  document_entity_keys,
  document_node_references,
  document_paths,
) {
  /** @type {GraphEdge[]} */
  const graph_edges = [];
  let edge_number = 0;

  for (const claim of claims) {
    const mapping_definition = resolveMappingDefinition(mappings, claim);

    if (!mapping_definition?.emit) {
      continue;
    }

    const source_document_node = getDocumentGraphNode(
      graph_nodes,
      document_node_references,
      claim,
    );
    const target_reference = resolveTargetReference(
      mapping_definition.emit.target_class,
      mapping_definition.emit.target,
      claim,
      document_entity_keys,
      document_node_references,
      document_paths,
    );
    const target_node = upsertNode(
      graph_nodes,
      target_reference.class_name,
      target_reference.key,
    );

    setCanonicalPath(target_node, target_reference.path);

    edge_number += 1;
    graph_edges.push({
      from: source_document_node.id,
      id: `edge:${edge_number}`,
      origin: claim.origin,
      relation: mapping_definition.emit.relation,
      to: target_node.id,
    });
  }

  return graph_edges;
}

/**
 * @param {Map<string, GraphNode>} graph_nodes
 * @param {PatramConfig} patram_config
 * @param {{ field: string, key?: 'path' | 'value', class: string }} node_mapping
 * @param {PatramClaim} claim
 * @param {Map<string, string>} document_entity_keys
 * @param {Map<string, import('./document-node-identity.js').DocumentNodeReference>} document_node_references
 * @param {Map<string, number>} title_priorities
 */
function applyNodeMapping(
  graph_nodes,
  patram_config,
  node_mapping,
  claim,
  document_entity_keys,
  document_node_references,
  title_priorities,
) {
  const source_key = normalizeRepoRelativePath(claim.origin.path);
  const graph_node = resolveGraphNode(
    graph_nodes,
    node_mapping,
    claim,
    document_entity_keys,
    document_node_references,
  );
  const field_value = resolveNodeFieldValue(
    graph_node,
    node_mapping,
    claim,
    source_key,
  );

  setCanonicalPath(graph_node, source_key);
  validateNodeFieldMapping(
    patram_config,
    node_mapping.class,
    node_mapping.field,
  );

  if (node_mapping.field === 'title') {
    setNodeTitle(
      graph_node,
      title_priorities,
      field_value,
      claim.type === 'document.title'
        ? DERIVED_TITLE_PRIORITY
        : EXPLICIT_TITLE_PRIORITY,
    );
    return;
  }

  setNodeFieldValue(
    graph_node,
    node_mapping.field,
    field_value,
    getFieldDefinition(patram_config, node_mapping.field),
  );
}

/**
 * Validate one mapped node field against the configured field model.
 *
 * @param {PatramConfig} patram_config
 * @param {string} node_class
 * @param {string} field_name
 */
function validateNodeFieldMapping(patram_config, node_class, field_name) {
  const validation_error = getNodeFieldValidationError(
    patram_config,
    node_class,
    field_name,
  );

  if (validation_error) {
    throw new Error(validation_error);
  }
}

/**
 * @param {PatramConfig} patram_config
 * @param {string} node_class
 * @param {string} field_name
 * @returns {string | null}
 */
function getNodeFieldValidationError(patram_config, node_class, field_name) {
  if (isStructuralFieldName(field_name) || field_name === 'title') {
    return null;
  }

  const field_definition = getFieldDefinition(patram_config, field_name);

  if (!field_definition) {
    return `Node class "${node_class}" maps to unknown field "${field_name}".`;
  }

  const class_schema = getClassSchema(patram_config, node_class);
  const class_field_rule = class_schema?.fields?.[field_name];

  if (isForbiddenClassField(class_field_rule)) {
    return `Field "${field_name}" is forbidden for class "${node_class}".`;
  }

  if (isUndeclaredClassField(class_schema, class_field_rule)) {
    return `Field "${field_name}" is not declared for class "${node_class}".`;
  }

  return null;
}

/**
 * @param {{ presence: 'required' | 'optional' | 'forbidden' } | undefined} class_field_rule
 * @returns {boolean}
 */
function isForbiddenClassField(class_field_rule) {
  return class_field_rule?.presence === 'forbidden';
}

/**
 * @param {{ fields?: Record<string, { presence: 'required' | 'optional' | 'forbidden' }>, unknown_fields?: 'ignore' | 'error' } | undefined} class_schema
 * @param {{ presence: 'required' | 'optional' | 'forbidden' } | undefined} class_field_rule
 * @returns {boolean}
 */
function isUndeclaredClassField(class_schema, class_field_rule) {
  return class_schema?.unknown_fields === 'error' && !class_field_rule;
}

/**
 * @param {Map<string, GraphNode>} graph_nodes
 * @param {string} kind_name
 * @param {string} node_key
 * @returns {GraphNode}
 */
function upsertNode(graph_nodes, kind_name, node_key) {
  const node_id = getNodeId(kind_name, node_key);
  const existing_node = graph_nodes.get(node_id);

  if (existing_node) {
    return existing_node;
  }

  const graph_node = createNode(node_id, kind_name, node_key);

  graph_nodes.set(node_id, graph_node);

  return graph_node;
}

/**
 * @param {string} node_id
 * @param {string} class_name
 * @param {string} node_key
 * @returns {GraphNode}
 */
function createNode(node_id, class_name, node_key) {
  if (class_name === 'document') {
    return {
      $class: class_name,
      $id: node_id,
      $path: node_key,
      id: node_id,
      path: node_key,
    };
  }

  return {
    $class: class_name,
    $id: node_id,
    id: node_id,
    key: node_key,
  };
}

/**
 * @param {string} kind_name
 * @param {string} node_key
 * @returns {string}
 */
function getNodeId(kind_name, node_key) {
  if (kind_name === 'document') {
    return `doc:${node_key}`;
  }

  return `${kind_name}:${node_key}`;
}

/**
 * @param {PatramClaim} claim
 * @returns {string}
 */
function getNodeFieldValue(claim) {
  if (typeof claim.value === 'string') {
    return claim.value;
  }

  throw new Error(`Claim "${claim.id}" does not carry a string value.`);
}

/**
 * @param {Map<string, import('./document-node-identity.js').DocumentNodeReference>} document_node_references
 * @returns {{ configurable: false, enumerable: false, value: Record<string, string>, writable: false }}
 */
function createDocumentNodeIdsProperty(document_node_references) {
  return {
    configurable: false,
    enumerable: false,
    value: Object.fromEntries(
      [...document_node_references.entries()].map(
        ([document_path, document_node_reference]) => [
          document_path,
          document_node_reference.id,
        ],
      ),
    ),
    writable: false,
  };
}

/**
 * @param {Map<string, GraphNode>} graph_nodes
 * @param {Map<string, import('./document-node-identity.js').DocumentNodeReference>} document_node_references
 * @param {PatramClaim} claim
 * @returns {GraphNode}
 */
function getDocumentGraphNode(graph_nodes, document_node_references, claim) {
  const document_path = normalizeRepoRelativePath(claim.origin.path);
  const document_node_reference = document_node_references.get(document_path);

  if (!document_node_reference) {
    throw new Error(`Missing document node reference for "${document_path}".`);
  }

  const graph_node = upsertNode(
    graph_nodes,
    document_node_reference.class_name,
    document_node_reference.key,
  );

  setCanonicalPath(graph_node, document_node_reference.path);

  return graph_node;
}

/**
 * @param {Map<string, GraphNode>} graph_nodes
 * @param {{ field: string, key?: 'path' | 'value', class: string }} node_mapping
 * @param {PatramClaim} claim
 * @param {Map<string, string>} document_entity_keys
 * @param {Map<string, import('./document-node-identity.js').DocumentNodeReference>} document_node_references
 * @returns {GraphNode}
 */
function resolveGraphNode(
  graph_nodes,
  node_mapping,
  claim,
  document_entity_keys,
  document_node_references,
) {
  if (node_mapping.class === 'document') {
    return getDocumentGraphNode(graph_nodes, document_node_references, claim);
  }

  const node_key = resolveNodeKey(node_mapping, claim, document_entity_keys);

  return upsertNode(graph_nodes, node_mapping.class, node_key);
}

/**
 * @param {GraphNode} graph_node
 * @param {{ field: string, key?: 'path' | 'value', class: string }} node_mapping
 * @param {PatramClaim} claim
 * @param {string} source_path
 * @returns {string}
 */
function resolveNodeFieldValue(graph_node, node_mapping, claim, source_path) {
  if (node_mapping.field === '$id') {
    return graph_node.id;
  }

  if (node_mapping.field === '$class') {
    return graph_node.$class ?? graph_node.kind ?? node_mapping.class;
  }

  if (node_mapping.field === '$path') {
    return source_path;
  }

  return getNodeFieldValue(claim);
}

/**
 * @param {Record<string, GraphNode>} graph_nodes
 * @param {Map<string, import('./document-node-identity.js').DocumentNodeReference>} document_node_references
 */
function attachDocumentNodeAliases(graph_nodes, document_node_references) {
  for (const [
    document_path,
    document_node_reference,
  ] of document_node_references) {
    const document_node_id = `doc:${document_path}`;

    if (document_node_id === document_node_reference.id) {
      continue;
    }

    Object.defineProperty(graph_nodes, document_node_id, {
      configurable: false,
      enumerable: false,
      value: graph_nodes[document_node_reference.id],
      writable: false,
    });
  }
}

/**
 * @param {Map<string, GraphNode>} graph_nodes
 * @param {Map<string, number>} title_priorities
 */
function applyFallbackTitles(graph_nodes, title_priorities) {
  for (const graph_node of graph_nodes.values()) {
    if (graph_node.title !== undefined) {
      continue;
    }

    const fallback_title = getFallbackTitle(graph_node);

    graph_node.title = fallback_title;
    title_priorities.set(graph_node.id, 0);
  }
}

/**
 * @param {GraphNode} graph_node
 * @returns {string}
 */
function getFallbackTitle(graph_node) {
  if (graph_node.$path) {
    return posix.basename(graph_node.$path);
  }

  return getNodeIdKey(graph_node.$id ?? graph_node.id);
}

/**
 * @param {GraphNode} graph_node
 * @param {Map<string, number>} title_priorities
 * @param {string} title_value
 * @param {number} source_priority
 */
function setNodeTitle(
  graph_node,
  title_priorities,
  title_value,
  source_priority,
) {
  const current_priority = title_priorities.get(graph_node.id);

  if (current_priority === undefined) {
    graph_node.title = title_value;
    title_priorities.set(graph_node.id, source_priority);
    return;
  }

  if (source_priority > current_priority) {
    graph_node.title = title_value;
    title_priorities.set(graph_node.id, source_priority);
    return;
  }

  if (
    source_priority === current_priority &&
    graph_node.title !== title_value
  ) {
    throw new Error(
      `Node "${graph_node.id}" has conflicting title values "${graph_node.title}" and "${title_value}".`,
    );
  }
}

/**
 * @param {GraphNode} graph_node
 * @param {string} field_name
 * @param {string} field_value
 * @param {MetadataFieldConfig | undefined} field_definition
 */
function setNodeFieldValue(
  graph_node,
  field_name,
  field_value,
  field_definition,
) {
  if (
    field_name === '$id' ||
    field_name === '$class' ||
    field_name === '$path'
  ) {
    setStructuralFieldValue(graph_node, field_name, field_value);
    return;
  }

  if (!field_definition || field_definition.multiple !== true) {
    setSingleValueField(graph_node, field_name, field_value);
    return;
  }

  setMultiValueField(graph_node, field_name, field_value);
}

/**
 * @param {GraphNode} graph_node
 * @param {'$id' | '$class' | '$path'} field_name
 * @param {string} field_value
 */
function setStructuralFieldValue(graph_node, field_name, field_value) {
  const current_value = graph_node[field_name];

  if (current_value === undefined) {
    assignStructuralFieldValue(graph_node, field_name, field_value);
    return;
  }

  if (
    field_name === '$class' &&
    graph_node.id.startsWith('doc:') &&
    current_value === 'document'
  ) {
    assignStructuralFieldValue(graph_node, field_name, field_value);
    return;
  }

  if (current_value !== field_value) {
    throw new Error(
      `Node "${graph_node.id}" has conflicting structural values for "${field_name}".`,
    );
  }
}

/**
 * Keep legacy mirrors in sync while the rest of the codebase still reads them.
 *
 * @param {GraphNode} graph_node
 * @param {'$id' | '$class' | '$path'} field_name
 * @param {string} field_value
 */
function assignStructuralFieldValue(graph_node, field_name, field_value) {
  graph_node[field_name] = field_value;

  if (field_name === '$path') {
    graph_node.path = field_value;
  }
}

/**
 * @param {GraphNode} graph_node
 * @param {string} field_name
 * @param {string} field_value
 */
function setSingleValueField(graph_node, field_name, field_value) {
  const current_value = graph_node[field_name];

  if (current_value === undefined) {
    graph_node[field_name] = field_value;
    return;
  }

  if (current_value !== field_value) {
    const current_value_text = Array.isArray(current_value)
      ? current_value.join(', ')
      : current_value;

    throw new Error(
      `Node "${graph_node.id}" has conflicting values for field "${field_name}": "${current_value_text}" and "${field_value}".`,
    );
  }
}

/**
 * @param {GraphNode} graph_node
 * @param {string} field_name
 * @param {string} field_value
 */
function setMultiValueField(graph_node, field_name, field_value) {
  const current_value = graph_node[field_name];

  if (current_value === undefined) {
    graph_node[field_name] = [field_value];
    return;
  }

  if (Array.isArray(current_value)) {
    if (current_value.includes(field_value)) {
      return;
    }

    graph_node[field_name] = [...current_value, field_value].sort(
      compareFieldValues,
    );
    return;
  }

  graph_node[field_name] = [current_value, field_value].sort(
    compareFieldValues,
  );
}

/**
 * @param {string} left_value
 * @param {string} right_value
 * @returns {number}
 */
function compareFieldValues(left_value, right_value) {
  return left_value.localeCompare(right_value, DETERMINISTIC_LOCALE);
}

/**
 * @param {PatramConfig} patram_config
 * @param {string} field_name
 * @returns {MetadataFieldConfig | undefined}
 */
function getFieldDefinition(patram_config, field_name) {
  return patram_config.fields?.[field_name];
}

/**
 * @param {PatramConfig} patram_config
 * @param {string} class_name
 * @returns {{ fields?: Record<string, { presence: 'required' | 'optional' | 'forbidden' }>, unknown_fields?: 'ignore' | 'error' } | undefined}
 */
function getClassSchema(patram_config, class_name) {
  return patram_config.classes[class_name]?.schema;
}

/**
 * @param {string} field_name
 * @returns {field_name is '$class' | '$id' | '$path'}
 */
function isStructuralFieldName(field_name) {
  return STRUCTURAL_FIELD_NAMES.has(field_name);
}

/**
 * @param {[string, GraphNode]} left_entry
 * @param {[string, GraphNode]} right_entry
 * @returns {number}
 */
function compareNodeEntries(left_entry, right_entry) {
  return left_entry[0].localeCompare(right_entry[0], DETERMINISTIC_LOCALE);
}

/**
 * @param {string} node_id
 * @returns {string}
 */
function getNodeIdKey(node_id) {
  const separator_index = node_id.indexOf(':');

  if (separator_index < 0) {
    return node_id;
  }

  return node_id.slice(separator_index + 1);
}
