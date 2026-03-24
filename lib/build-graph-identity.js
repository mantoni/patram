/**
 * @import { DocumentNodeReference } from './document-node-identity.js';
 * @import { GraphNode } from './build-graph.types.ts';
 * @import { PatramClaim } from './parse-claims.types.ts';
 */

import { posix } from 'node:path';

import { normalizeRepoRelativePath } from './document-node-identity.js';

export {
  collectDocumentEntityKeys,
  collectDocumentNodeReferences,
  normalizeRepoRelativePath,
  resolveDocumentNodeId,
} from './document-node-identity.js';

/**
 * Resolve the node key for one mapped claim.
 *
 * @param {{ field: string, key?: 'path' | 'value', class: string }} node_mapping
 * @param {PatramClaim} claim
 * @param {Map<string, string>} document_entity_keys
 * @returns {string}
 */
export function resolveNodeKey(node_mapping, claim, document_entity_keys) {
  const source_key = normalizeRepoRelativePath(claim.origin.path);

  if (node_mapping.class === 'document') {
    return source_key;
  }

  if (node_mapping.key === 'value') {
    return getStringClaimValue(claim);
  }

  return (
    document_entity_keys.get(
      getDocumentEntityMapKey(source_key, node_mapping.class),
    ) ?? source_key
  );
}

/**
 * Resolve one edge target key and canonical path.
 *
 * @param {string} target_class
 * @param {'path' | 'value'} target_type
 * @param {PatramClaim} claim
 * @param {Map<string, string>} document_entity_keys
 * @param {Map<string, DocumentNodeReference>} document_node_references
 * @param {Set<string>} document_paths
 * @returns {{ class_name: string, key: string, path?: string }}
 */
export function resolveTargetReference(
  target_class,
  target_type,
  claim,
  document_entity_keys,
  document_node_references,
  document_paths,
) {
  if (target_type === 'value') {
    return resolveValueTargetReference(target_class, claim);
  }

  return resolvePathTargetReference(
    target_class,
    claim,
    document_entity_keys,
    document_node_references,
    document_paths,
  );
}

/**
 * Attach one canonical path to a graph node.
 *
 * @param {GraphNode} graph_node
 * @param {string | undefined} source_path
 */
export function setCanonicalPath(graph_node, source_path) {
  if (!source_path) {
    return;
  }

  if (!graph_node.$path) {
    graph_node.$path = source_path;
    graph_node.path = source_path;
    return;
  }

  if (graph_node.$path !== source_path) {
    throw new Error(
      `Node "${graph_node.id}" maps to multiple canonical paths.`,
    );
  }
}

/**
 * @param {string} target_kind
 * @param {PatramClaim} claim
 * @returns {{ class_name: string, key: string, path?: string }}
 */
function resolveValueTargetReference(target_kind, claim) {
  const target_key = getStringClaimValue(claim);

  if (target_kind === 'document') {
    return {
      class_name: 'document',
      key: target_key,
      path: target_key,
    };
  }

  return {
    class_name: target_kind,
    key: target_key,
    path: normalizeRepoRelativePath(claim.origin.path),
  };
}

/**
 * @param {string} target_class
 * @param {PatramClaim} claim
 * @param {Map<string, string>} document_entity_keys
 * @param {Map<string, DocumentNodeReference>} document_node_references
 * @param {Set<string>} document_paths
 * @returns {{ class_name: string, key: string, path?: string }}
 */
function resolvePathTargetReference(
  target_class,
  claim,
  document_entity_keys,
  document_node_references,
  document_paths,
) {
  const raw_target = getPathTargetValue(claim);
  const target_path = resolveDirectiveAwareTargetPath(
    claim,
    raw_target,
    document_paths,
  );

  if (target_class === 'document') {
    return resolveDocumentTargetReference(
      target_path,
      document_node_references,
    );
  }

  const document_node_reference = document_node_references.get(target_path);

  if (documentNodeReferenceIsPromoted(document_node_reference)) {
    return {
      class_name: document_node_reference.class_name,
      key: document_node_reference.key,
      path: target_path,
    };
  }

  return {
    class_name: target_class,
    key:
      document_entity_keys.get(
        getDocumentEntityMapKey(target_path, target_class),
      ) ?? target_path,
    path: target_path,
  };
}

/**
 * @param {string} target_path
 * @param {Map<string, DocumentNodeReference>} document_node_references
 * @returns {{ class_name: string, key: string, path?: string }}
 */
function resolveDocumentTargetReference(target_path, document_node_references) {
  const document_node_reference = document_node_references.get(target_path);

  if (!document_node_reference) {
    return {
      class_name: 'document',
      key: target_path,
      path: target_path,
    };
  }

  return {
    class_name: document_node_reference.class_name,
    key: document_node_reference.key,
    path: target_path,
  };
}

/**
 * @param {PatramClaim} claim
 * @param {string} raw_target
 * @param {Set<string>} document_paths
 * @returns {string}
 */
function resolveDirectiveAwareTargetPath(claim, raw_target, document_paths) {
  const normalized_raw_target = normalizeRepoRelativePath(raw_target);

  if (claim.type === 'directive' && document_paths.has(normalized_raw_target)) {
    return normalized_raw_target;
  }

  const source_directory = posix.dirname(
    normalizeRepoRelativePath(claim.origin.path),
  );

  return normalizeRepoRelativePath(posix.join(source_directory, raw_target));
}

/**
 * @param {PatramClaim} claim
 * @returns {string}
 */
function getPathTargetValue(claim) {
  if (typeof claim.value === 'string') {
    return claim.value;
  }

  return claim.value.target;
}

/**
 * @param {PatramClaim} claim
 * @returns {string}
 */
function getStringClaimValue(claim) {
  if (typeof claim.value === 'string') {
    return claim.value;
  }

  throw new Error(`Claim "${claim.id}" does not carry a string value.`);
}

/**
 * @param {string} document_path
 * @param {string} class_name
 * @returns {string}
 */
function getDocumentEntityMapKey(document_path, class_name) {
  return `${class_name}:${document_path}`;
}

/**
 * @param {DocumentNodeReference | undefined} document_node_reference
 * @returns {document_node_reference is DocumentNodeReference}
 */
function documentNodeReferenceIsPromoted(document_node_reference) {
  return (
    document_node_reference !== undefined &&
    document_node_reference.class_name !== 'document'
  );
}
