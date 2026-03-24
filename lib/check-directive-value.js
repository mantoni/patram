/**
 * @import { DirectiveTypeConfig, MetadataDirectiveRuleConfig, PatramDiagnostic, PatramRepoConfig } from './load-patram-config.types.ts';
 * @import { PatramClaim } from './parse-claims.types.ts';
 * @import { MappingDefinition } from './patram-config.types.ts';
 */

import { resolveTargetReference } from './build-graph-identity.js';
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

  if (validation_field_name === '$class') {
    return checkClassValue(claim, directive_name, repo_config);
  }

  if (isStructuralDirectiveField(validation_field_name)) {
    return [];
  }

  const type_definition = repo_config.fields?.[validation_field_name];

  if (!type_definition) {
    return [];
  }

  if (type_definition.type === 'enum') {
    return checkEnumValue(claim, directive_name, type_definition.values);
  }

  const type_diagnostic = createInvalidTypeDiagnostic(
    claim,
    directive_name,
    type_definition,
    claim.value,
  );

  if (type_diagnostic) {
    return [type_diagnostic];
  }

  return createPathClassDiagnostics(
    claim,
    directive_name,
    mappings,
    repo_config,
    type_definition,
    document_entity_keys,
    document_paths,
  );
}

/**
 * @param {PatramClaim} claim
 * @param {string} directive_name
 * @param {PatramRepoConfig} repo_config
 * @returns {PatramDiagnostic[]}
 */
function checkClassValue(claim, directive_name, repo_config) {
  if (
    typeof claim.value !== 'string' ||
    repo_config.classes?.[claim.value] !== undefined
  ) {
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
 * @param {string[]} allowed_values
 * @returns {PatramDiagnostic[]}
 */
function checkEnumValue(claim, directive_name, allowed_values) {
  if (typeof claim.value !== 'string' || allowed_values.includes(claim.value)) {
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
 * @param {Exclude<DirectiveTypeConfig, { type: 'enum' }>} type_definition
 * @param {string} directive_value
 * @returns {PatramDiagnostic | null}
 */
function createInvalidTypeDiagnostic(
  claim,
  directive_name,
  type_definition,
  directive_value,
) {
  if (isDirectiveValueValid(type_definition, directive_value)) {
    return null;
  }

  return createOriginDiagnostic(
    claim,
    'directive.invalid_type',
    getInvalidTypeMessage(directive_name, type_definition.type),
  );
}

/**
 * @param {PatramClaim} claim
 * @param {string} directive_name
 * @param {Record<string, MappingDefinition>} mappings
 * @param {PatramRepoConfig} repo_config
 * @param {Exclude<DirectiveTypeConfig, { type: 'enum' }>} type_definition
 * @param {Map<string, string>} document_entity_keys
 * @param {Set<string>} document_paths
 * @returns {PatramDiagnostic[]}
 */
function createPathClassDiagnostics(
  claim,
  directive_name,
  mappings,
  repo_config,
  type_definition,
  document_entity_keys,
  document_paths,
) {
  if (
    type_definition.type !== 'path' ||
    type_definition.path_class === undefined ||
    isDirectivePathInClass(
      mappings,
      claim,
      type_definition.path_class,
      document_entity_keys,
      document_paths,
      repo_config,
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
 * @param {Record<string, MappingDefinition>} mappings
 * @param {PatramClaim} claim
 * @param {string} path_class_name
 * @param {Map<string, string>} document_entity_keys
 * @param {Set<string>} document_paths
 * @param {PatramRepoConfig} repo_config
 * @returns {boolean}
 */
function isDirectivePathInClass(
  mappings,
  claim,
  path_class_name,
  document_entity_keys,
  document_paths,
  repo_config,
) {
  const path_class_definition = repo_config.path_classes?.[path_class_name];

  if (!path_class_definition) {
    return true;
  }

  const mapping_definition = resolveDirectiveMapping(mappings, claim);
  const target_kind = mapping_definition?.emit?.target_class ?? 'document';
  const resolved_target = resolveTargetReference(
    target_kind,
    'path',
    claim,
    document_entity_keys,
    document_paths,
  );

  if (!resolved_target.path) {
    return false;
  }

  return path_class_definition.prefixes.some((prefix) =>
    resolved_target.path?.startsWith(prefix),
  );
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
  if (mapping_definition?.node?.field) {
    return mapping_definition.node.field;
  }

  return directive_name;
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

/**
 * @param {PatramClaim} claim
 * @param {string} code
 * @param {string} message
 * @returns {PatramDiagnostic}
 */
