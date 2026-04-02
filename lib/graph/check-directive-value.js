/**
 * @import { MetadataFieldConfig, PatramDiagnostic, PatramRepoConfig } from '../config/load-patram-config.types.ts';
 * @import { PatramClaim } from '../parse/parse-claims.types.ts';
 */

import {
  createPathExistenceDiagnostics,
  createTargetTypeDiagnostics,
} from './check-directive-path-target.js';
import { createOriginDiagnostic } from './directive-diagnostics.js';
import {
  formatQuotedList,
  getInvalidTypeMessage,
  isDirectiveValueValid,
} from './directive-type-rules.js';

/**
 * Check one directive claim value against typed validation rules.
 *
 * @param {PatramClaim} claim
 * @param {string} directive_name
 * @param {PatramRepoConfig} repo_config
 * @param {Map<string, string>} document_entity_keys
 * @param {Map<string, import('./document-node-identity.js').DocumentNodeReference>} document_node_references
 * @param {Set<string>} document_paths
 * @returns {PatramDiagnostic[]}
 */
export function checkDirectiveValue(
  claim,
  directive_name,
  repo_config,
  document_entity_keys,
  document_node_references,
  document_paths,
) {
  if (!directive_name || typeof claim.value !== 'string') {
    return [];
  }

  if (directive_name === 'title' || directive_name === 'description') {
    return [];
  }

  const type_definition = repo_config.fields?.[directive_name];

  if (!type_definition) {
    return [];
  }

  if (type_definition.type === 'enum') {
    return checkEnumValue(
      claim,
      directive_name,
      claim.value,
      type_definition.values,
    );
  }

  if (
    type_definition.type !== 'ref' &&
    !isDirectiveValueValid(type_definition, claim.value)
  ) {
    return [
      createOriginDiagnostic(
        claim,
        'directive.invalid_type',
        getInvalidTypeMessage(directive_name, type_definition.type),
      ),
    ];
  }

  return collectPathDiagnostics(
    claim,
    directive_name,
    type_definition,
    document_entity_keys,
    document_node_references,
    document_paths,
  );
}

/**
 * @param {PatramClaim} claim
 * @param {string} directive_name
 * @param {string} directive_value
 * @param {string[]} allowed_values
 * @returns {PatramDiagnostic[]}
 */
function checkEnumValue(
  claim,
  directive_name,
  directive_value,
  allowed_values,
) {
  if (allowed_values.includes(directive_value)) {
    return [];
  }

  return [
    createOriginDiagnostic(
      claim,
      'directive.invalid_enum',
      `Directive "${directive_name}" must be one of ${formatQuotedList(allowed_values)}.`,
    ),
  ];
}

/**
 * @param {PatramClaim} claim
 * @param {string} directive_name
 * @param {MetadataFieldConfig} type_definition
 * @param {Map<string, string>} document_entity_keys
 * @param {Map<string, import('./document-node-identity.js').DocumentNodeReference>} document_node_references
 * @param {Set<string>} document_paths
 * @returns {PatramDiagnostic[]}
 */
function collectPathDiagnostics(
  claim,
  directive_name,
  type_definition,
  document_entity_keys,
  document_node_references,
  document_paths,
) {
  const diagnostics = createPathExistenceDiagnostics(
    claim,
    directive_name,
    type_definition,
    document_entity_keys,
    document_node_references,
    document_paths,
  );

  if (type_definition.type !== 'ref') {
    return diagnostics;
  }

  return diagnostics.concat(
    createTargetTypeDiagnostics(
      claim,
      directive_name,
      type_definition,
      document_entity_keys,
      document_node_references,
      document_paths,
    ),
  );
}
