/**
 * @import { DirectiveTypeConfig, MetadataDirectiveRuleConfig, PatramDiagnostic, PatramRepoConfig } from '../config/load-patram-config.types.ts';
 * @import { PatramClaim } from '../parse/parse-claims.types.ts';
 * @import { MappingDefinition } from './patram-config.types.ts';
 */

import {
  createPathClassDiagnostics,
  createPathExistenceDiagnostics,
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
 * @param {Record<string, MappingDefinition>} mappings
 * @param {PatramRepoConfig} repo_config
 * @param {MetadataDirectiveRuleConfig | undefined} _directive_rule
 * @param {Map<string, string>} document_entity_keys
 * @param {Map<string, import('./document-node-identity.js').DocumentNodeReference>} document_node_references
 * @param {Set<string>} document_paths
 * @returns {PatramDiagnostic[]}
 */
export function checkDirectiveValue(
  claim,
  directive_name,
  mappings,
  repo_config,
  _directive_rule,
  document_entity_keys,
  document_node_references,
  document_paths,
) {
  const mapping_definition = resolveDirectiveMapping(mappings, claim);
  const validation_field_name = getDirectiveValidationFieldName(
    directive_name,
    mapping_definition,
  );
  if (!validation_field_name || typeof claim.value !== 'string') {
    return [];
  }
  const directive_value = claim.value;
  if (validation_field_name === '$class') {
    return checkClassValue(claim, directive_name, directive_value, repo_config);
  }
  const type_definition = repo_config.fields?.[validation_field_name];
  if (isStructuralDirectiveField(validation_field_name) || !type_definition) {
    return collectUntypedPathDiagnostics(
      claim,
      directive_name,
      mapping_definition,
      document_entity_keys,
      document_node_references,
      document_paths,
    );
  }
  return checkTypedDirectiveValue(
    claim,
    directive_name,
    directive_value,
    mappings,
    repo_config,
    mapping_definition,
    type_definition,
    document_entity_keys,
    document_node_references,
    document_paths,
  );
}

/**
 * @param {PatramClaim} claim
 * @param {string} directive_name
 * @param {string} class_name
 * @param {PatramRepoConfig} repo_config
 * @returns {PatramDiagnostic[]}
 */
function checkClassValue(claim, directive_name, class_name, repo_config) {
  if (repo_config.classes?.[class_name] !== undefined) {
    return [];
  }

  return [
    createOriginDiagnostic(
      claim,
      'directive.invalid_enum',
      `Directive "${directive_name}" must reference a configured class.`,
    ),
  ];
}

/**
 * @param {PatramClaim} claim
 * @param {string} directive_name
 * @param {string} directive_value
 * @param {Record<string, MappingDefinition>} mappings
 * @param {PatramRepoConfig} repo_config
 * @param {MappingDefinition | null} mapping_definition
 * @param {DirectiveTypeConfig} type_definition
 * @param {Map<string, string>} document_entity_keys
 * @param {Map<string, import('./document-node-identity.js').DocumentNodeReference>} document_node_references
 * @param {Set<string>} document_paths
 * @returns {PatramDiagnostic[]}
 */
function checkTypedDirectiveValue(
  claim,
  directive_name,
  directive_value,
  mappings,
  repo_config,
  mapping_definition,
  type_definition,
  document_entity_keys,
  document_node_references,
  document_paths,
) {
  if (type_definition.type === 'enum') {
    return checkEnumValue(
      claim,
      directive_name,
      directive_value,
      type_definition.values,
    );
  }

  if (!isDirectiveValueValid(type_definition, directive_value)) {
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
    mappings,
    repo_config,
    mapping_definition,
    type_definition,
    document_entity_keys,
    document_node_references,
    document_paths,
  );
}

/**
 * @param {PatramClaim} claim
 * @param {string} directive_name
 * @param {MappingDefinition | null} mapping_definition
 * @param {Map<string, string>} document_entity_keys
 * @param {Map<string, import('./document-node-identity.js').DocumentNodeReference>} document_node_references
 * @param {Set<string>} document_paths
 * @returns {PatramDiagnostic[]}
 */
function collectUntypedPathDiagnostics(
  claim,
  directive_name,
  mapping_definition,
  document_entity_keys,
  document_node_references,
  document_paths,
) {
  return createPathExistenceDiagnostics(
    claim,
    directive_name,
    mapping_definition,
    undefined,
    document_entity_keys,
    document_node_references,
    document_paths,
  );
}

/**
 * @param {PatramClaim} claim
 * @param {string} directive_name
 * @param {Record<string, MappingDefinition>} mappings
 * @param {PatramRepoConfig} repo_config
 * @param {MappingDefinition | null} mapping_definition
 * @param {Exclude<DirectiveTypeConfig, { type: 'enum' }>} type_definition
 * @param {Map<string, string>} document_entity_keys
 * @param {Map<string, import('./document-node-identity.js').DocumentNodeReference>} document_node_references
 * @param {Set<string>} document_paths
 * @returns {PatramDiagnostic[]}
 */
function collectPathDiagnostics(
  claim,
  directive_name,
  mappings,
  repo_config,
  mapping_definition,
  type_definition,
  document_entity_keys,
  document_node_references,
  document_paths,
) {
  return createPathClassDiagnostics(
    claim,
    directive_name,
    mappings,
    repo_config,
    type_definition,
    document_entity_keys,
    document_node_references,
    document_paths,
  ).concat(
    createPathExistenceDiagnostics(
      claim,
      directive_name,
      mapping_definition,
      type_definition,
      document_entity_keys,
      document_node_references,
      document_paths,
    ),
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
 * @param {string} directive_name
 * @param {MappingDefinition | null} mapping_definition
 * @returns {string}
 */
function getDirectiveValidationFieldName(directive_name, mapping_definition) {
  return mapping_definition?.node?.field ?? directive_name;
}

/**
 * @param {string} field_name
 * @returns {boolean}
 */
function isStructuralDirectiveField(field_name) {
  return (
    field_name === '$class' ||
    field_name === '$id' ||
    field_name === '$path' ||
    field_name === 'title'
  );
}
