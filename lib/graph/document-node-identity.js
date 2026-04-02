/* eslint-disable complexity, max-lines */
/**
 * @import { PatramClaim } from '../parse/parse-claims.types.ts';
 * @import { PatramClassConfig, PatramConfig } from '../config/patram-config.types.ts';
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
 * @param {PatramConfig} patram_config
 * @param {PatramClaim[]} claims
 * @returns {Map<string, string>}
 */
export function collectDocumentEntityKeys(patram_config, claims) {
  /** @type {Map<string, string>} */
  const document_entity_keys = new Map();
  const document_node_references = collectDocumentNodeReferences(
    patram_config,
    claims,
  );

  for (const [
    document_path,
    document_node_reference,
  ] of document_node_references) {
    if (document_node_reference.class_name === 'document') {
      continue;
    }

    document_entity_keys.set(
      getDocumentEntityMapKey(
        document_path,
        document_node_reference.class_name,
      ),
      document_node_reference.key,
    );
  }

  return document_entity_keys;
}

/**
 * Collect canonical graph identities for document-backed source paths.
 *
 * @param {PatramConfig} patram_config
 * @param {PatramClaim[]} claims
 * @returns {Map<string, DocumentNodeReference>}
 */
export function collectDocumentNodeReferences(patram_config, claims) {
  /** @type {Map<string, DocumentNodeReference>} */
  const document_node_references = new Map();
  const claims_by_path = groupClaimsByPath(claims);

  for (const [source_path, path_claims] of claims_by_path) {
    document_node_references.set(
      source_path,
      resolveDocumentNodeReference(patram_config, source_path, path_claims),
    );
  }

  return document_node_references;
}

/**
 * Resolve the canonical node id for a source document path.
 *
 * @param {Record<string, string> | undefined} document_path_ids
 * @param {string} document_path
 * @returns {string}
 */
export function resolveDocumentNodeId(document_path_ids, document_path) {
  return document_path_ids?.[document_path] ?? `doc:${document_path}`;
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
 * @param {PatramConfig} patram_config
 * @param {string} source_path
 * @param {PatramClaim[]} claims
 * @returns {DocumentNodeReference}
 */
function resolveDocumentNodeReference(patram_config, source_path, claims) {
  const claim_value_reference = resolveClaimValueIdentityReference(
    patram_config.classes,
    claims,
    source_path,
  );

  if (claim_value_reference) {
    return claim_value_reference;
  }

  const document_path_reference = resolveDocumentPathIdentityReference(
    patram_config,
    source_path,
  );

  if (document_path_reference) {
    return document_path_reference;
  }

  return createDefaultDocumentNodeReference(source_path);
}

/**
 * @param {PatramConfig['classes']} classes
 * @param {PatramClaim[]} claims
 * @param {string} source_path
 * @returns {DocumentNodeReference | null}
 */
function resolveClaimValueIdentityReference(classes, claims, source_path) {
  /** @type {DocumentNodeReference | null} */
  let document_node_reference = null;

  for (const [class_name, class_definition] of Object.entries(classes)) {
    if (
      class_name === 'document' ||
      class_definition.identity?.type !== 'claim_value'
    ) {
      continue;
    }

    const node_key = resolveClaimValueIdentityKey(
      class_definition.identity.claim_types,
      claims,
      source_path,
      class_name,
    );

    if (!node_key) {
      continue;
    }

    const next_reference = createDocumentNodeReference(
      class_name,
      node_key,
      source_path,
    );

    if (
      document_node_reference &&
      document_node_reference.id !== next_reference.id
    ) {
      throw new Error(
        `Document "${source_path}" defines multiple semantic classes.`,
      );
    }

    document_node_reference = next_reference;
  }

  return document_node_reference;
}

/**
 * @param {string[]} claim_types
 * @param {PatramClaim[]} claims
 * @param {string} source_path
 * @param {string} class_name
 * @returns {string | null}
 */
function resolveClaimValueIdentityKey(
  claim_types,
  claims,
  source_path,
  class_name,
) {
  /** @type {string | null} */
  let node_key = null;

  for (const claim of claims) {
    if (!claim_types.includes(resolveClaimType(claim))) {
      continue;
    }

    const claim_value = getStringClaimValue(claim);

    if (node_key && node_key !== claim_value) {
      throw new Error(
        `Document "${source_path}" defines multiple semantic ids for class "${class_name}".`,
      );
    }

    node_key = claim_value;
  }

  return node_key;
}

/**
 * @param {PatramConfig} patram_config
 * @param {string} source_path
 * @returns {DocumentNodeReference | null}
 */
function resolveDocumentPathIdentityReference(patram_config, source_path) {
  /** @type {{ class_name: string, prefix: string } | null} */
  let best_match = null;

  for (const [class_name, class_definition] of Object.entries(
    patram_config.classes,
  )) {
    if (
      class_name === 'document' ||
      class_definition.identity?.type !== 'document_path'
    ) {
      continue;
    }

    const path_prefix = resolveDocumentPathPrefix(
      patram_config,
      class_definition,
    );

    if (!path_prefix || !source_path.startsWith(path_prefix)) {
      continue;
    }

    if (!best_match || path_prefix.length > best_match.prefix.length) {
      best_match = {
        class_name,
        prefix: path_prefix,
      };
      continue;
    }

    if (
      path_prefix.length === best_match.prefix.length &&
      best_match.class_name !== class_name
    ) {
      throw new Error(
        `Document "${source_path}" matches multiple document-path identities.`,
      );
    }
  }

  if (!best_match) {
    return null;
  }

  return createDocumentNodeReference(
    best_match.class_name,
    deriveDocumentPathIdentityKey(source_path, best_match.prefix),
    source_path,
  );
}

/**
 * @param {PatramConfig} patram_config
 * @param {PatramClassConfig} class_definition
 * @returns {string | null}
 */
function resolveDocumentPathPrefix(patram_config, class_definition) {
  const document_path_class = class_definition.schema?.document_path_class;

  if (!document_path_class) {
    return null;
  }

  const path_class = patram_config.path_classes?.[document_path_class];

  if (!path_class) {
    return null;
  }

  return (
    [...path_class.prefixes]
      .map((prefix) => normalizeRepoRelativePath(prefix))
      .sort(
        (left_prefix, right_prefix) => right_prefix.length - left_prefix.length,
      )[0] ?? null
  );
}

/**
 * @param {string} source_path
 * @param {string} path_prefix
 * @returns {string}
 */
function deriveDocumentPathIdentityKey(source_path, path_prefix) {
  const relative_path = source_path.slice(path_prefix.length);
  const relative_directory = posix.dirname(relative_path);
  const base_name = posix.basename(relative_path, posix.extname(relative_path));

  if (relative_directory === '.') {
    return base_name;
  }

  return posix.join(relative_directory, base_name);
}

/**
 * @param {PatramClaim[]} claims
 * @returns {Map<string, PatramClaim[]>}
 */
function groupClaimsByPath(claims) {
  /** @type {Map<string, PatramClaim[]>} */
  const claims_by_path = new Map();

  for (const claim of claims) {
    const source_path = normalizeRepoRelativePath(claim.origin.path);
    const path_claims = claims_by_path.get(source_path) ?? [];

    path_claims.push(claim);
    claims_by_path.set(source_path, path_claims);
  }

  return claims_by_path;
}

/**
 * @param {string} class_name
 * @param {string} node_key
 * @param {string} source_path
 * @returns {DocumentNodeReference}
 */
function createDocumentNodeReference(class_name, node_key, source_path) {
  return {
    class_name,
    id: getNodeId(class_name, node_key),
    key: node_key,
    path: source_path,
  };
}

/**
 * @param {PatramClaim} claim
 * @returns {string}
 */
function resolveClaimType(claim) {
  if (claim.type !== 'directive') {
    return claim.type;
  }

  if (!claim.parser || !claim.name) {
    return claim.type;
  }

  return `${claim.parser}.directive.${claim.name}`;
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
  return createDocumentNodeReference('document', source_path, source_path);
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
