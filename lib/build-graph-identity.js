/**
 * @import { GraphNode } from './build-graph.types.ts';
 * @import { PatramClaim } from './parse-claims.types.ts';
 * @import { MappingDefinition } from './patram-config.types.ts';
 */

import { posix } from 'node:path';

/**
 * Collect semantic entity keys defined by canonical documents.
 *
 * @param {Record<string, MappingDefinition>} mappings
 * @param {PatramClaim[]} claims
 * @returns {Map<string, string>}
 */
export function collectDocumentEntityKeys(mappings, claims) {
  /** @type {Map<string, string>} */
  const document_entity_keys = new Map();

  for (const claim of claims) {
    const mapping_definition = resolveMappingDefinition(mappings, claim);

    if (mapping_definition?.node?.key !== 'value') {
      continue;
    }

    const source_path = normalizeRepoRelativePath(claim.origin.path);
    const entity_map_key = getDocumentEntityMapKey(
      source_path,
      mapping_definition.node.class,
    );
    const entity_key = getStringClaimValue(claim);
    const existing_entity_key = document_entity_keys.get(entity_map_key);

    if (existing_entity_key && existing_entity_key !== entity_key) {
      throw new Error(
        `Document "${source_path}" defines multiple ${mapping_definition.node.class} ids.`,
      );
    }

    document_entity_keys.set(entity_map_key, entity_key);
  }

  return document_entity_keys;
}

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
 * @param {Set<string>} document_paths
 * @returns {{ key: string, path?: string }}
 */
export function resolveTargetReference(
  target_class,
  target_type,
  claim,
  document_entity_keys,
  document_paths,
) {
  if (target_type === 'value') {
    return resolveValueTargetReference(target_class, claim);
  }

  return resolvePathTargetReference(
    target_class,
    claim,
    document_entity_keys,
    document_paths,
  );
}

/**
 * Attach one canonical path to a non-document graph node.
 *
 * @param {GraphNode} graph_node
 * @param {string | undefined} source_path
 */
export function setNonDocumentPath(graph_node, source_path) {
  if (!source_path || graph_node.$class === 'document') {
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
 * Normalize one repo-relative source path.
 *
 * @param {string} source_path
 * @returns {string}
 */
export function normalizeRepoRelativePath(source_path) {
  return posix.normalize(source_path.replaceAll('\\', '/'));
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
 * @param {string} target_kind
 * @param {PatramClaim} claim
 * @returns {{ key: string, path?: string }}
 */
function resolveValueTargetReference(target_kind, claim) {
  const target_key = getStringClaimValue(claim);

  if (target_kind === 'document') {
    return {
      key: target_key,
      path: target_key,
    };
  }

  return {
    key: target_key,
    path: normalizeRepoRelativePath(claim.origin.path),
  };
}

/**
 * @param {string} target_class
 * @param {PatramClaim} claim
 * @param {Map<string, string>} document_entity_keys
 * @param {Set<string>} document_paths
 * @returns {{ key: string, path?: string }}
 */
function resolvePathTargetReference(
  target_class,
  claim,
  document_entity_keys,
  document_paths,
) {
  const raw_target = getPathTargetValue(claim);
  const target_path = resolveDirectiveAwareTargetPath(
    claim,
    raw_target,
    document_paths,
  );

  if (target_class === 'document') {
    return {
      key: target_path,
      path: target_path,
    };
  }

  const semantic_target_key = document_entity_keys.get(
    getDocumentEntityMapKey(target_path, target_class),
  );

  return {
    key: semantic_target_key ?? target_path,
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
