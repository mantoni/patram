/* eslint-disable complexity, max-lines */
/**
 * @import { PatramClaim } from '../parse/parse-claims.types.ts';
 * @import { PatramConfig } from '../config/patram-config.types.ts';
 */

import { matchesGlob, posix } from 'node:path';

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
 * @param {PatramConfig} patram_config
 * @param {string} source_path
 * @param {PatramClaim[]} claims
 * @returns {DocumentNodeReference}
 */
function resolveDocumentNodeReference(patram_config, source_path, claims) {
  const defined_by_reference = resolveDefinedByReference(
    patram_config.types,
    claims,
    source_path,
  );

  if (defined_by_reference) {
    return defined_by_reference;
  }

  const path_type_reference = resolvePathTypeReference(
    patram_config.types,
    source_path,
  );

  if (path_type_reference) {
    return path_type_reference;
  }

  return createDefaultDocumentNodeReference(source_path);
}

/**
 * @param {PatramConfig['types']} types
 * @param {PatramClaim[]} claims
 * @param {string} source_path
 * @returns {DocumentNodeReference | null}
 */
function resolveDefinedByReference(types, claims, source_path) {
  /** @type {DocumentNodeReference | null} */
  let document_node_reference = null;

  for (const [type_name, type_definition] of Object.entries(types ?? {})) {
    if (!type_definition.defined_by) {
      continue;
    }

    const node_key = resolveDefinedByKey(
      type_definition.defined_by,
      claims,
      source_path,
      type_name,
    );

    if (!node_key) {
      continue;
    }

    const next_reference = createDocumentNodeReference(
      type_name,
      node_key,
      source_path,
    );

    if (
      document_node_reference &&
      document_node_reference.id !== next_reference.id
    ) {
      throw new Error(
        `Document "${source_path}" defines multiple semantic types.`,
      );
    }

    document_node_reference = next_reference;
  }

  return document_node_reference;
}

/**
 * @param {string} field_name
 * @param {PatramClaim[]} claims
 * @param {string} source_path
 * @param {string} type_name
 * @returns {string | null}
 */
function resolveDefinedByKey(field_name, claims, source_path, type_name) {
  /** @type {string | null} */
  let node_key = null;

  for (const claim of claims) {
    if (claim.type !== 'directive' || claim.name !== field_name) {
      continue;
    }

    const claim_value = getStringClaimValue(claim);

    if (node_key && node_key !== claim_value) {
      throw new Error(
        `Document "${source_path}" defines multiple semantic ids for type "${type_name}".`,
      );
    }

    node_key = claim_value;
  }

  return node_key;
}

/**
 * @param {PatramConfig['types']} types
 * @param {string} source_path
 * @returns {DocumentNodeReference | null}
 */
function resolvePathTypeReference(types, source_path) {
  /** @type {{ prefix: string, type_name: string } | null} */
  let best_match = null;

  for (const [type_name, type_definition] of Object.entries(types ?? {})) {
    for (const pattern of type_definition.in ?? []) {
      if (!matchesGlob(source_path, pattern)) {
        continue;
      }

      const prefix = getGlobPrefix(pattern);

      if (!best_match || prefix.length > best_match.prefix.length) {
        best_match = {
          prefix,
          type_name,
        };
        continue;
      }

      if (
        prefix.length === best_match.prefix.length &&
        best_match.type_name !== type_name
      ) {
        throw new Error(
          `Document "${source_path}" matches multiple path-backed types.`,
        );
      }
    }
  }

  if (!best_match) {
    return null;
  }

  return createDocumentNodeReference(
    best_match.type_name,
    deriveDocumentPathIdentityKey(source_path, best_match.prefix),
    source_path,
  );
}

/**
 * @param {string} target_class
 * @param {PatramClaim} claim
 * @returns {{ class_name: string, key: string, path?: string }}
 */
function resolveValueTargetReference(target_class, claim) {
  const target_key = getStringClaimValue(claim);

  if (target_class === 'document') {
    return {
      class_name: 'document',
      key: target_key,
      path: target_key,
    };
  }

  return {
    class_name: target_class,
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

  if (document_node_reference?.class_name === target_class) {
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

  if (
    claim.type === 'directive' &&
    shouldKeepDirectiveTargetRepoRelative(
      raw_target,
      normalized_raw_target,
      document_paths,
    )
  ) {
    return normalized_raw_target;
  }

  const source_directory = posix.dirname(
    normalizeRepoRelativePath(claim.origin.path),
  );

  return normalizeRepoRelativePath(posix.join(source_directory, raw_target));
}

/**
 * @param {string} raw_target
 * @param {string} normalized_raw_target
 * @param {Set<string>} document_paths
 * @returns {boolean}
 */
function shouldKeepDirectiveTargetRepoRelative(
  raw_target,
  normalized_raw_target,
  document_paths,
) {
  if (raw_target.startsWith('./') || raw_target.startsWith('../')) {
    return false;
  }

  if (document_paths.has(normalized_raw_target)) {
    return true;
  }

  const target_root_segment = normalized_raw_target.split('/')[0];

  if (!target_root_segment) {
    return false;
  }

  for (const document_path of document_paths) {
    if (document_path.split('/')[0] === target_root_segment) {
      return true;
    }
  }

  return false;
}

/**
 * @param {string} source_path
 * @param {string} path_prefix
 * @returns {string}
 */
function deriveDocumentPathIdentityKey(source_path, path_prefix) {
  const normalized_prefix = normalizeRepoRelativePath(path_prefix);
  const relative_path = source_path.startsWith(normalized_prefix)
    ? source_path.slice(normalized_prefix.length)
    : source_path;
  const relative_directory = posix.dirname(relative_path);
  const base_name = posix.basename(relative_path, posix.extname(relative_path));

  if (relative_directory === '.') {
    return base_name;
  }

  return posix.join(relative_directory, base_name);
}

/**
 * @param {string} glob_pattern
 * @returns {string}
 */
function getGlobPrefix(glob_pattern) {
  const normalized_pattern = normalizeRepoRelativePath(glob_pattern);
  const wildcard_index = normalized_pattern.search(/[*?[{]/du);

  if (wildcard_index < 0) {
    return normalized_pattern;
  }

  const prefix = normalized_pattern.slice(0, wildcard_index);

  return prefix.endsWith('/')
    ? prefix
    : posix.dirname(prefix).replace(/\/?$/u, '/');
}

/**
 * @param {PatramClaim} claim
 * @returns {string}
 */
function getPathTargetValue(claim) {
  if (typeof claim.value === 'string') {
    return claim.value;
  }

  if (
    claim.value &&
    typeof claim.value === 'object' &&
    'target' in claim.value
  ) {
    const target_value = claim.value.target;

    if (typeof target_value === 'string') {
      return target_value;
    }
  }

  throw new Error(`Claim "${claim.id}" does not carry a path target.`);
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
