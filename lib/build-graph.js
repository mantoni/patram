/**
 * @import { BuildGraphResult, GraphEdge, GraphNode } from './build-graph.types.ts';
 * @import { PatramClaim } from './parse-claims.types.ts';
 * @import { MappingDefinition, PatramConfig } from './patram-config.types.ts';
 */

import {
  collectDocumentEntityKeys,
  normalizeRepoRelativePath,
  resolveNodeKey,
  resolveTargetReference,
  setNonDocumentPath,
} from './build-graph-identity.js';

/**
 * Claim-to-graph materialization.
 *
 * Maps parsed claims into document nodes and relations using the resolved
 * Patram graph config.
 *
 * Kind: graph
 * Status: active
 * Uses Term: ../docs/reference/terms/claim.md
 * Uses Term: ../docs/reference/terms/document.md
 * Uses Term: ../docs/reference/terms/graph.md
 * Uses Term: ../docs/reference/terms/mapping.md
 * Uses Term: ../docs/reference/terms/relation.md
 * Tracked in: ../docs/plans/v0/source-anchor-dogfooding.md
 * Decided by: ../docs/decisions/graph-materialization.md
 * Implements: ../docs/tasks/v0/materialize-graph.md
 * @patram
 * @see {@link ./load-project-graph.js}
 * @see {@link ../docs/decisions/graph-materialization.md}
 */

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
  const document_entity_keys = collectDocumentEntityKeys(
    patram_config.mappings,
    claims,
  );
  /** @type {Set<string>} */
  const document_paths = new Set(
    claims.map((claim) => normalizeRepoRelativePath(claim.origin.path)),
  );

  createDocumentNodes(graph_nodes, claims);
  applyNodeMappings(
    graph_nodes,
    patram_config.mappings,
    claims,
    document_entity_keys,
  );
  const graph_edges = createGraphEdges(
    graph_nodes,
    patram_config.mappings,
    claims,
    document_entity_keys,
    document_paths,
  );

  return {
    edges: graph_edges,
    nodes: Object.fromEntries(
      [...graph_nodes.entries()].sort(compareNodeEntries),
    ),
  };
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
 * @param {PatramClaim[]} claims
 */
function createDocumentNodes(graph_nodes, claims) {
  for (const claim of claims) {
    upsertNode(
      graph_nodes,
      'document',
      normalizeRepoRelativePath(claim.origin.path),
    );
  }
}

/**
 * @param {Map<string, GraphNode>} graph_nodes
 * @param {Record<string, MappingDefinition>} mappings
 * @param {PatramClaim[]} claims
 * @param {Map<string, string>} document_entity_keys
 */
function applyNodeMappings(
  graph_nodes,
  mappings,
  claims,
  document_entity_keys,
) {
  for (const claim of claims) {
    const mapping_definition = resolveMappingDefinition(mappings, claim);

    if (!mapping_definition?.node) {
      continue;
    }

    applyNodeMapping(
      graph_nodes,
      mapping_definition.node,
      claim,
      document_entity_keys,
    );
  }
}

/**
 * @param {Map<string, GraphNode>} graph_nodes
 * @param {Record<string, MappingDefinition>} mappings
 * @param {PatramClaim[]} claims
 * @param {Map<string, string>} document_entity_keys
 * @param {Set<string>} document_paths
 * @returns {GraphEdge[]}
 */
function createGraphEdges(
  graph_nodes,
  mappings,
  claims,
  document_entity_keys,
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

    const source_document_node = upsertNode(
      graph_nodes,
      'document',
      normalizeRepoRelativePath(claim.origin.path),
    );
    const target_reference = resolveTargetReference(
      mapping_definition.emit.target_kind,
      mapping_definition.emit.target,
      claim,
      document_entity_keys,
      document_paths,
    );
    const target_node = upsertNode(
      graph_nodes,
      mapping_definition.emit.target_kind,
      target_reference.key,
    );

    setNonDocumentPath(target_node, target_reference.path);

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
 * @param {{ field: string, key?: 'path' | 'value', kind: string }} node_mapping
 * @param {PatramClaim} claim
 * @param {Map<string, string>} document_entity_keys
 */
function applyNodeMapping(
  graph_nodes,
  node_mapping,
  claim,
  document_entity_keys,
) {
  const source_key = normalizeRepoRelativePath(claim.origin.path);
  const node_key = resolveNodeKey(node_mapping, claim, document_entity_keys);
  const graph_node = upsertNode(graph_nodes, node_mapping.kind, node_key);

  setNonDocumentPath(graph_node, source_key);

  graph_node[node_mapping.field] = getNodeFieldValue(claim);
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
 * @param {string} kind_name
 * @param {string} node_key
 * @returns {GraphNode}
 */
function createNode(node_id, kind_name, node_key) {
  if (kind_name === 'document') {
    return {
      id: node_id,
      kind: kind_name,
      path: node_key,
    };
  }

  return {
    id: node_id,
    key: node_key,
    kind: kind_name,
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
 * @param {[string, GraphNode]} left_entry
 * @param {[string, GraphNode]} right_entry
 * @returns {number}
 */
function compareNodeEntries(left_entry, right_entry) {
  return left_entry[0].localeCompare(right_entry[0], 'en');
}
