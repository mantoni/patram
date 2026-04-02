/**
 * @import { MetadataFieldConfig, PatramDiagnostic } from '../config/load-patram-config.types.ts';
 * @import { PatramClaim } from '../parse/parse-claims.types.ts';
 */

import { isPathLikeTarget } from '../parse/claim-helpers.js';
import { resolveTargetReference } from './build-graph-identity.js';
import { createOriginDiagnostic } from './directive-diagnostics.js';

/**
 * @param {PatramClaim} claim
 * @param {string} directive_name
 * @param {MetadataFieldConfig | undefined} type_definition
 * @param {Map<string, string>} document_entity_keys
 * @param {Map<string, import('./document-node-identity.js').DocumentNodeReference>} document_node_references
 * @param {Set<string>} document_paths
 * @returns {PatramDiagnostic[]}
 */
export function createPathExistenceDiagnostics(
  claim,
  directive_name,
  type_definition,
  document_entity_keys,
  document_node_references,
  document_paths,
) {
  if (
    typeof claim.value !== 'string' ||
    !isPathLikeTarget(claim.value) ||
    !shouldCheckDirectivePathExistence(type_definition)
  ) {
    return [];
  }

  const resolved_target = resolveDirectiveTargetPath(
    claim,
    type_definition,
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
 * @param {Extract<MetadataFieldConfig, { type: 'ref' }>} type_definition
 * @param {Map<string, string>} document_entity_keys
 * @param {Map<string, import('./document-node-identity.js').DocumentNodeReference>} document_node_references
 * @param {Set<string>} document_paths
 * @returns {PatramDiagnostic[]}
 */
export function createTargetTypeDiagnostics(
  claim,
  directive_name,
  type_definition,
  document_entity_keys,
  document_node_references,
  document_paths,
) {
  if (typeof claim.value !== 'string' || !isPathLikeTarget(claim.value)) {
    return [];
  }

  const resolved_target = resolveDirectiveTargetPath(
    claim,
    type_definition,
    document_entity_keys,
    document_node_references,
    document_paths,
  );

  if (!resolved_target || !document_paths.has(resolved_target)) {
    return [];
  }

  const target_reference = document_node_references.get(resolved_target);

  if (
    type_definition.to === 'document' ||
    target_reference?.class_name === type_definition.to
  ) {
    return [];
  }

  return [
    createOriginDiagnostic(
      claim,
      'directive.invalid_target_type',
      `Directive "${directive_name}" must point to type "${type_definition.to}".`,
    ),
  ];
}

/**
 * @param {PatramClaim} claim
 * @param {MetadataFieldConfig | undefined} type_definition
 * @param {Map<string, string>} document_entity_keys
 * @param {Map<string, import('./document-node-identity.js').DocumentNodeReference>} document_node_references
 * @param {Set<string>} document_paths
 * @returns {string | undefined}
 */
function resolveDirectiveTargetPath(
  claim,
  type_definition,
  document_entity_keys,
  document_node_references,
  document_paths,
) {
  const target_type =
    type_definition?.type === 'ref' ? type_definition.to : 'document';
  const resolved_target = resolveTargetReference(
    target_type,
    'path',
    claim,
    document_entity_keys,
    document_node_references,
    document_paths,
  );

  return resolved_target.path;
}

/**
 * @param {MetadataFieldConfig | undefined} type_definition
 * @returns {boolean}
 */
function shouldCheckDirectivePathExistence(type_definition) {
  return type_definition?.type === 'path' || type_definition?.type === 'ref';
}
