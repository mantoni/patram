/* eslint-disable max-lines */
/**
 * @import { BuildGraphResult, GraphEdge, GraphNode } from './build-graph.types.ts';
 * @import { PatramClaim } from '../parse/parse-claims.types.ts';
 * @import { MetadataFieldConfig, PatramRepoConfig } from '../config/load-patram-config.types.ts';
 */

import { posix } from 'node:path';

import {
  collectDocumentEntityKeys,
  collectDocumentNodeReferences,
  normalizeRepoRelativePath,
  resolveTargetReference,
  setCanonicalPath,
} from './build-graph-identity.js';

const DERIVED_DESCRIPTION_PRIORITY = 1;
const DERIVED_TITLE_PRIORITY = 1;
const EXPLICIT_DESCRIPTION_PRIORITY = 2;
const EXPLICIT_TITLE_PRIORITY = 2;

/**
 * Build a Patram graph from repo config and parsed claims.
 *
 * kind: graph
 * status: active
 * uses_term: ../../docs/reference/terms/graph.md
 * tracked_in: ../../docs/plans/v2/types-and-fields-config.md
 * decided_by: ../../docs/decisions/types-and-fields-config.md
 * @patram
 * @see {@link ./build-graph-identity.js}
 * @see {@link ../../docs/decisions/types-and-fields-config.md}
 *
 * @param {PatramRepoConfig} repo_config
 * @param {PatramClaim[]} claims
 * @returns {BuildGraphResult}
 */
export function buildGraph(repo_config, claims) {
  /** @type {Map<string, GraphNode>} */
  const graph_nodes = new Map();
  const document_node_references = collectDocumentNodeReferences(
    repo_config,
    claims,
  );
  const document_entity_keys = collectDocumentEntityKeys(repo_config, claims);
  /** @type {Set<string>} */
  const document_paths = new Set(
    claims.map((claim) => normalizeRepoRelativePath(claim.origin.path)),
  );
  /** @type {Map<string, number>} */
  const description_priorities = new Map();
  /** @type {Map<string, number>} */
  const title_priorities = new Map();

  createDocumentNodes(graph_nodes, document_node_references);
  applyMetadataClaims(
    graph_nodes,
    repo_config,
    claims,
    document_node_references,
    title_priorities,
    description_priorities,
  );
  const graph_edges = createGraphEdges(
    graph_nodes,
    repo_config,
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
    'document_path_ids',
    createDocumentPathIdsProperty(document_node_references),
  );

  return graph_result;
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
 * @param {PatramRepoConfig} repo_config
 * @param {PatramClaim[]} claims
 * @param {Map<string, import('./document-node-identity.js').DocumentNodeReference>} document_node_references
 * @param {Map<string, number>} title_priorities
 * @param {Map<string, number>} description_priorities
 */
function applyMetadataClaims(
  graph_nodes,
  repo_config,
  claims,
  document_node_references,
  title_priorities,
  description_priorities,
) {
  for (const claim of claims) {
    const source_graph_node = getSourceGraphNode(
      graph_nodes,
      document_node_references,
      claim,
    );

    if (
      applyDerivedMetadataClaim(
        source_graph_node,
        claim,
        title_priorities,
        description_priorities,
      )
    ) {
      continue;
    }

    if (claim.type !== 'directive' || !claim.name) {
      continue;
    }

    const field_context = resolveScalarFieldContext(
      repo_config,
      source_graph_node,
      claim.name,
    );

    if (!field_context) {
      continue;
    }

    const field_value = getScalarClaimValue(claim);
    assignExplicitMetadataValue(
      source_graph_node,
      claim.name,
      field_value,
      field_context.is_many,
      title_priorities,
      description_priorities,
    );
  }
}

/**
 * @param {Map<string, GraphNode>} graph_nodes
 * @param {PatramRepoConfig} repo_config
 * @param {PatramClaim[]} claims
 * @param {Map<string, string>} document_entity_keys
 * @param {Map<string, import('./document-node-identity.js').DocumentNodeReference>} document_node_references
 * @param {Set<string>} document_paths
 * @returns {GraphEdge[]}
 */
function createGraphEdges(
  graph_nodes,
  repo_config,
  claims,
  document_entity_keys,
  document_node_references,
  document_paths,
) {
  /** @type {GraphEdge[]} */
  const graph_edges = [];
  let edge_number = 0;

  for (const claim of claims) {
    const edge_definition = resolveEdgeDefinition(repo_config, claim);

    if (!edge_definition) {
      continue;
    }

    const source_document_node = getSourceGraphNode(
      graph_nodes,
      document_node_references,
      claim,
    );
    const target_reference = resolveTargetReference(
      edge_definition.target_class,
      'path',
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
      from: source_document_node.identity.id,
      id: `edge:${edge_number}`,
      origin: claim.origin,
      relation: edge_definition.relation_name,
      to: target_node.identity.id,
    });
  }

  return graph_edges;
}

/**
 * @param {PatramRepoConfig} repo_config
 * @param {PatramClaim} claim
 * @returns {{ relation_name: string, target_class: string } | null}
 */
function resolveEdgeDefinition(repo_config, claim) {
  if (claim.type === 'markdown.link' || claim.type === 'jsdoc.link') {
    return {
      relation_name: 'links_to',
      target_class: 'document',
    };
  }

  if (claim.type !== 'directive' || !claim.name) {
    return null;
  }

  const field_definition = repo_config.fields?.[claim.name];

  if (field_definition?.type !== 'ref') {
    return null;
  }

  return {
    relation_name: claim.name,
    target_class: field_definition.to,
  };
}

/**
 * @param {Map<string, GraphNode>} graph_nodes
 * @param {Map<string, import('./document-node-identity.js').DocumentNodeReference>} document_node_references
 * @param {PatramClaim} claim
 * @returns {GraphNode}
 */
function getSourceGraphNode(graph_nodes, document_node_references, claim) {
  const source_path = normalizeRepoRelativePath(claim.origin.path);
  const document_node_reference = document_node_references.get(source_path);

  if (!document_node_reference) {
    return upsertNode(graph_nodes, 'document', source_path);
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
 * @param {MetadataFieldConfig} field_definition
 * @param {GraphNode} graph_node
 * @returns {boolean}
 */
function fieldAppliesToNode(field_definition, graph_node) {
  if (!field_definition.on || field_definition.on.length === 0) {
    return true;
  }

  return field_definition.on.includes(graph_node.identity.class_name);
}

/**
 * @param {PatramClaim} claim
 * @returns {string}
 */
function getScalarClaimValue(claim) {
  if (typeof claim.value === 'string') {
    return claim.value;
  }

  throw new Error(`Claim "${claim.id}" does not carry a string value.`);
}

/**
 * @param {GraphNode} source_graph_node
 * @param {PatramClaim} claim
 * @param {Map<string, number>} title_priorities
 * @param {Map<string, number>} description_priorities
 * @returns {boolean}
 */
function applyDerivedMetadataClaim(
  source_graph_node,
  claim,
  title_priorities,
  description_priorities,
) {
  if (claim.type === 'document.title' && typeof claim.value === 'string') {
    assignMetadataValue(
      source_graph_node,
      'title',
      claim.value,
      false,
      title_priorities,
      DERIVED_TITLE_PRIORITY,
    );
    return true;
  }

  if (
    claim.type === 'document.description' &&
    typeof claim.value === 'string'
  ) {
    assignMetadataValue(
      source_graph_node,
      'description',
      claim.value,
      false,
      description_priorities,
      DERIVED_DESCRIPTION_PRIORITY,
    );
    return true;
  }

  return false;
}

/**
 * @param {PatramRepoConfig} repo_config
 * @param {GraphNode} source_graph_node
 * @param {string} field_name
 * @returns {{ is_many: boolean } | null}
 */
function resolveScalarFieldContext(repo_config, source_graph_node, field_name) {
  const field_definition = repo_config.fields?.[field_name];

  if (
    field_name !== 'title' &&
    field_name !== 'description' &&
    (!field_definition || field_definition.type === 'ref')
  ) {
    return null;
  }

  if (
    field_definition &&
    !fieldAppliesToNode(field_definition, source_graph_node)
  ) {
    return null;
  }

  return {
    is_many: field_definition?.many === true,
  };
}

/**
 * @param {GraphNode} graph_node
 * @param {string} field_name
 * @param {string} field_value
 * @param {boolean} is_many
 * @param {Map<string, number>} title_priorities
 * @param {Map<string, number>} description_priorities
 */
function assignExplicitMetadataValue(
  graph_node,
  field_name,
  field_value,
  is_many,
  title_priorities,
  description_priorities,
) {
  if (field_name === 'title') {
    assignMetadataValue(
      graph_node,
      'title',
      field_value,
      is_many,
      title_priorities,
      EXPLICIT_TITLE_PRIORITY,
    );
    return;
  }

  if (field_name === 'description') {
    assignMetadataValue(
      graph_node,
      'description',
      field_value,
      is_many,
      description_priorities,
      EXPLICIT_DESCRIPTION_PRIORITY,
    );
    return;
  }

  assignMetadataValue(graph_node, field_name, field_value, is_many);
}

/**
 * @param {GraphNode} graph_node
 * @param {string} field_name
 * @param {string} field_value
 * @param {boolean} multiple
 * @param {Map<string, number>} [field_priorities]
 * @param {number} [field_priority]
 */
function assignMetadataValue(
  graph_node,
  field_name,
  field_value,
  multiple,
  field_priorities,
  field_priority,
) {
  if (
    shouldSkipLowerPriorityValue(
      graph_node,
      field_name,
      field_priorities,
      field_priority,
    )
  ) {
    return;
  }

  const existing_value = graph_node.metadata[field_name];

  if (multiple) {
    graph_node.metadata[field_name] = appendMetadataValue(
      existing_value,
      field_value,
    );
    return;
  }

  assignSingleMetadataValue(
    graph_node,
    field_name,
    field_value,
    existing_value,
  );
}

/**
 * @param {GraphNode} graph_node
 * @param {string} field_name
 * @param {Map<string, number> | undefined} field_priorities
 * @param {number | undefined} field_priority
 * @returns {boolean}
 */
function shouldSkipLowerPriorityValue(
  graph_node,
  field_name,
  field_priorities,
  field_priority,
) {
  if (!field_priorities || field_priority === undefined) {
    return false;
  }

  const priority_key = `${graph_node.identity.id}:${field_name}`;
  const previous_priority = field_priorities.get(priority_key) ?? 0;

  if (field_priority < previous_priority) {
    return true;
  }

  if (field_priority <= previous_priority) {
    return false;
  }

  graph_node.metadata[field_name] = undefined;
  field_priorities.set(priority_key, field_priority);
  return false;
}

/**
 * @param {GraphNode['metadata'][string]} existing_value
 * @param {string} field_value
 * @returns {string[]}
 */
function appendMetadataValue(existing_value, field_value) {
  const next_values = new Set(
    Array.isArray(existing_value)
      ? existing_value
      : existing_value
        ? [existing_value]
        : [],
  );

  next_values.add(field_value);
  return [...next_values].sort();
}

/**
 * @param {GraphNode} graph_node
 * @param {string} field_name
 * @param {string} field_value
 * @param {GraphNode['metadata'][string]} existing_value
 */
function assignSingleMetadataValue(
  graph_node,
  field_name,
  field_value,
  existing_value,
) {
  if (existing_value === undefined) {
    graph_node.metadata[field_name] = field_value;
    return;
  }

  if (Array.isArray(existing_value)) {
    throw new Error(
      `Node "${graph_node.identity.id}" has conflicting values for field "${field_name}".`,
    );
  }

  if (existing_value === field_value) {
    return;
  }

  throw new Error(
    `Node "${graph_node.identity.id}" has conflicting values for field "${field_name}": "${existing_value}" and "${field_value}".`,
  );
}

/**
 * @param {Map<string, GraphNode>} graph_nodes
 * @param {Map<string, number>} title_priorities
 */
function applyFallbackTitles(graph_nodes, title_priorities) {
  for (const graph_node of graph_nodes.values()) {
    if (graph_node.metadata.title !== undefined) {
      continue;
    }

    const fallback_title = resolveFallbackTitle(graph_node);

    if (!fallback_title) {
      continue;
    }

    assignMetadataValue(
      graph_node,
      'title',
      fallback_title,
      false,
      title_priorities,
      DERIVED_TITLE_PRIORITY,
    );
  }
}

/**
 * @param {GraphNode} graph_node
 * @returns {string | null}
 */
function resolveFallbackTitle(graph_node) {
  if (graph_node.identity.path) {
    return posix.basename(graph_node.identity.path);
  }

  return graph_node.key ?? null;
}

/**
 * @param {Map<string, GraphNode>} graph_nodes
 * @param {string} class_name
 * @param {string} node_key
 * @returns {GraphNode}
 */
function upsertNode(graph_nodes, class_name, node_key) {
  const node_id = getNodeId(class_name, node_key);
  const existing_node = graph_nodes.get(node_id);

  if (existing_node) {
    return existing_node;
  }

  const graph_node = {
    identity: {
      class_name,
      id: node_id,
    },
    key: node_key,
    metadata: {},
  };

  graph_nodes.set(node_id, graph_node);
  return graph_node;
}

/**
 * @param {string} class_name
 * @param {string} node_key
 * @returns {string}
 */
function getNodeId(class_name, node_key) {
  if (class_name === 'document') {
    return `doc:${node_key}`;
  }

  return `${class_name}:${node_key}`;
}

/**
 * @param {[string, GraphNode]} left_entry
 * @param {[string, GraphNode]} right_entry
 * @returns {number}
 */
function compareNodeEntries(left_entry, right_entry) {
  return left_entry[0].localeCompare(right_entry[0]);
}

/**
 * @param {Record<string, GraphNode>} graph_nodes
 * @param {Map<string, import('./document-node-identity.js').DocumentNodeReference>} document_node_references
 */
function attachDocumentNodeAliases(graph_nodes, document_node_references) {
  for (const document_node_reference of document_node_references.values()) {
    const document_id = `doc:${document_node_reference.path}`;

    if (graph_nodes[document_id]) {
      continue;
    }

    graph_nodes[document_id] = graph_nodes[document_node_reference.id];
  }
}

/**
 * @param {Map<string, import('./document-node-identity.js').DocumentNodeReference>} document_node_references
 * @returns {PropertyDescriptor}
 */
function createDocumentPathIdsProperty(document_node_references) {
  return {
    enumerable: false,
    value: Object.fromEntries(
      [...document_node_references.entries()].map(
        ([document_path, node_reference]) => [document_path, node_reference.id],
      ),
    ),
    writable: false,
  };
}
