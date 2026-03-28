/**
 * @import { DirectiveTypeConfig, PatramDiagnostic, PatramRepoConfig } from './load-patram-config.types.ts';
 * @import { PatramClaim } from './parse-claims.types.ts';
 * @import { MappingDefinition } from './patram-config.types.ts';
 */

import { isPathLikeTarget } from './claim-helpers.js';
import { resolveTargetReference } from './build-graph-identity.js';
import { createOriginDiagnostic } from './directive-diagnostics.js';

/**
 * @param {PatramClaim} claim
 * @param {string} directive_name
 * @param {MappingDefinition | null} mapping_definition
 * @param {Exclude<DirectiveTypeConfig, { type: 'enum' }> | undefined} type_definition
 * @param {Map<string, string>} document_entity_keys
 * @param {Map<string, import('./document-node-identity.js').DocumentNodeReference>} document_node_references
 * @param {Set<string>} document_paths
 * @returns {PatramDiagnostic[]}
 */
export function createPathExistenceDiagnostics(
  claim,
  directive_name,
  mapping_definition,
  type_definition,
  document_entity_keys,
  document_node_references,
  document_paths,
) {
  if (
    typeof claim.value !== 'string' ||
    !isPathLikeTarget(claim.value) ||
    !shouldCheckDirectivePathExistence(mapping_definition, type_definition)
  ) {
    return [];
  }

  const resolved_target = resolveDirectiveTargetPath(
    claim,
    mapping_definition,
    document_entity_keys,
    document_node_references,
    document_paths,
  );

  if (!resolved_target || document_paths.has(resolved_target)) {
    return [];
  }

  return [
    createOriginDiagnostic(
      claim,
      'directive.path_not_found',
      `Directive "${directive_name}" points to missing file "${resolved_target}".`,
    ),
  ];
}

/**
 * @param {PatramClaim} claim
 * @param {string} directive_name
 * @param {Record<string, MappingDefinition>} mappings
 * @param {PatramRepoConfig} repo_config
 * @param {Exclude<DirectiveTypeConfig, { type: 'enum' }>} type_definition
 * @param {Map<string, string>} document_entity_keys
 * @param {Map<string, import('./document-node-identity.js').DocumentNodeReference>} document_node_references
 * @param {Set<string>} document_paths
 * @returns {PatramDiagnostic[]}
 */
export function createPathClassDiagnostics(
  claim,
  directive_name,
  mappings,
  repo_config,
  type_definition,
  document_entity_keys,
  document_node_references,
  document_paths,
) {
  if (type_definition.type !== 'path' || !type_definition.path_class) {
    return [];
  }

  const path_class_definition =
    repo_config.path_classes?.[type_definition.path_class];

  if (!path_class_definition) {
    return [];
  }

  const mapping_definition = resolveDirectiveMapping(mappings, claim);
  const resolved_target = resolveDirectiveTargetPath(
    claim,
    mapping_definition,
    document_entity_keys,
    document_node_references,
    document_paths,
  );

  if (
    !resolved_target ||
    path_class_definition.prefixes.some((prefix) =>
      resolved_target.startsWith(prefix),
    )
  ) {
    return [];
  }

  return [
    createOriginDiagnostic(
      claim,
      'directive.invalid_path_class',
      `Directive "${directive_name}" must point to path class "${type_definition.path_class}".`,
    ),
  ];
}

/**
 * @param {PatramClaim} claim
 * @param {MappingDefinition | null} mapping_definition
 * @param {Map<string, string>} document_entity_keys
 * @param {Map<string, import('./document-node-identity.js').DocumentNodeReference>} document_node_references
 * @param {Set<string>} document_paths
 * @returns {string | undefined}
 */
function resolveDirectiveTargetPath(
  claim,
  mapping_definition,
  document_entity_keys,
  document_node_references,
  document_paths,
) {
  const target_kind = mapping_definition?.emit?.target_class ?? 'document';
  const resolved_target = resolveTargetReference(
    target_kind,
    'path',
    claim,
    document_entity_keys,
    document_node_references,
    document_paths,
  );

  return resolved_target.path;
}

/**
 * @param {Record<string, MappingDefinition>} mappings
 * @param {PatramClaim} claim
 * @returns {MappingDefinition | null}
 */
function resolveDirectiveMapping(mappings, claim) {
  if (!claim.name || !claim.parser) {
    return null;
  }

  return mappings[`${claim.parser}.directive.${claim.name}`] ?? null;
}

/**
 * @param {MappingDefinition | null} mapping_definition
 * @param {Exclude<DirectiveTypeConfig, { type: 'enum' }> | undefined} type_definition
 * @returns {boolean}
 */
function shouldCheckDirectivePathExistence(
  mapping_definition,
  type_definition,
) {
  if (type_definition?.type === 'path') {
    return true;
  }

  return mapping_definition?.emit?.target === 'path';
}
