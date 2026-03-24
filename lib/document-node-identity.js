/**
 * @import { PatramClaim } from './parse-claims.types.ts';
 * @import { MappingDefinition } from './patram-config.types.ts';
 */

import { posix } from 'node:path';

/**
 * @typedef {{
 *   class_name: string,
 *   id: string,
 *   key: string,
 *   path: string,
 * }} DocumentNodeReference
 */

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

    if (
      mapping_definition?.node?.key !== 'value' ||
      mapping_definition.node.class === 'document'
    ) {
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
 * Collect canonical graph identities for document-backed source paths.
 *
 * @param {Record<string, MappingDefinition>} mappings
 * @param {PatramClaim[]} claims
 * @returns {Map<string, DocumentNodeReference>}
 */
export function collectDocumentNodeReferences(mappings, claims) {
  /** @type {Map<string, DocumentNodeReference>} */
  const document_node_references = new Map();
  /** @type {Map<string, string>} */
  const pending_document_keys = new Map();

  for (const claim of claims) {
    const source_path = normalizeRepoRelativePath(claim.origin.path);
    const document_node_reference =
      document_node_references.get(source_path) ??
      createDefaultDocumentNodeReference(source_path);
    const mapping_definition = resolveMappingDefinition(mappings, claim);

    document_node_references.set(source_path, document_node_reference);

    if (mapping_definition?.node?.class !== 'document') {
      continue;
    }

    applyDocumentNodeMapping(
      document_node_reference,
      mapping_definition.node,
      claim,
      pending_document_keys,
      source_path,
    );
  }

  return document_node_references;
}

/**
 * Resolve the canonical node id for a source document path.
 *
 * @param {Record<string, string> | undefined} document_node_ids
 * @param {string} document_path
 * @returns {string}
 */
export function resolveDocumentNodeId(document_node_ids, document_path) {
  return document_node_ids?.[document_path] ?? `doc:${document_path}`;
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
 * @param {DocumentNodeReference} document_node_reference
 * @param {{ field: string, key?: 'path' | 'value', class: string }} node_mapping
 * @param {PatramClaim} claim
 * @param {Map<string, string>} pending_document_keys
 * @param {string} source_path
 */
function applyDocumentNodeMapping(
  document_node_reference,
  node_mapping,
  claim,
  pending_document_keys,
  source_path,
) {
  if (node_mapping.field === '$class') {
    assignDocumentNodeClass(
      document_node_reference,
      getStringClaimValue(claim),
    );
    applyPendingDocumentKey(
      document_node_reference,
      pending_document_keys,
      source_path,
    );
    return;
  }

  if (node_mapping.field !== '$id' || node_mapping.key !== 'value') {
    return;
  }

  const document_node_key = getStringClaimValue(claim);

  if (document_node_reference.class_name === 'document') {
    assignPendingDocumentKey(
      pending_document_keys,
      source_path,
      document_node_key,
    );
    return;
  }

  assignDocumentNodeKey(document_node_reference, document_node_key);
}

/**
 * @param {DocumentNodeReference} document_node_reference
 * @param {Map<string, string>} pending_document_keys
 * @param {string} source_path
 */
function applyPendingDocumentKey(
  document_node_reference,
  pending_document_keys,
  source_path,
) {
  if (document_node_reference.class_name === 'document') {
    return;
  }

  const pending_document_key = pending_document_keys.get(source_path);

  if (!pending_document_key) {
    return;
  }

  assignDocumentNodeKey(document_node_reference, pending_document_key);
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
 * @param {string} source_path
 * @returns {DocumentNodeReference}
 */
function createDefaultDocumentNodeReference(source_path) {
  return {
    class_name: 'document',
    id: `doc:${source_path}`,
    key: source_path,
    path: source_path,
  };
}

/**
 * @param {DocumentNodeReference} document_node_reference
 * @param {string} class_name
 */
function assignDocumentNodeClass(document_node_reference, class_name) {
  if (
    document_node_reference.class_name !== 'document' &&
    document_node_reference.class_name !== class_name
  ) {
    throw new Error(
      `Document "${document_node_reference.path}" defines multiple semantic classes.`,
    );
  }

  document_node_reference.class_name = class_name;
  document_node_reference.id = getNodeId(
    document_node_reference.class_name,
    document_node_reference.key,
  );
}

/**
 * @param {DocumentNodeReference} document_node_reference
 * @param {string} node_key
 */
function assignDocumentNodeKey(document_node_reference, node_key) {
  if (
    document_node_reference.key !== document_node_reference.path &&
    document_node_reference.key !== node_key
  ) {
    throw new Error(
      `Document "${document_node_reference.path}" defines multiple semantic ids.`,
    );
  }

  document_node_reference.key = node_key;
  document_node_reference.id = getNodeId(
    document_node_reference.class_name,
    document_node_reference.key,
  );
}

/**
 * @param {Map<string, string>} pending_document_keys
 * @param {string} source_path
 * @param {string} node_key
 */
function assignPendingDocumentKey(
  pending_document_keys,
  source_path,
  node_key,
) {
  const existing_node_key = pending_document_keys.get(source_path);

  if (existing_node_key && existing_node_key !== node_key) {
    throw new Error(`Document "${source_path}" defines multiple semantic ids.`);
  }

  pending_document_keys.set(source_path, node_key);
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
