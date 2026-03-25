/* eslint-disable max-lines */
/**
 * @import { BuildGraphResult } from './build-graph.types.ts';
 * @import { ClassFieldRuleConfig, MetadataFieldConfig, MetadataSchemaConfig, PatramDiagnostic, PatramRepoConfig } from './load-patram-config.types.ts';
 * @import { PatramClaim } from './parse-claims.types.ts';
 * @import { MappingDefinition } from './patram-config.types.ts';
 */

import {
  collectDocumentEntityKeys,
  collectDocumentNodeReferences,
  normalizeRepoRelativePath,
  resolveDocumentNodeId,
} from './build-graph-identity.js';
import { checkDirectiveValue } from './check-directive-value.js';
import {
  createDocumentDiagnostic,
  createOriginDiagnostic,
} from './directive-diagnostics.js';
import { resolvePatramGraphConfig } from './resolve-patram-graph-config.js';

/**
 * Directive and placement validation.
 *
 * Kind: graph
 * Status: active
 * Tracked in: ../docs/plans/v0/directive-type-validation.md
 * Decided by: ../docs/decisions/directive-type-validation.md
 * @patram
 * @see {@link ./check-graph.js}
 * @see {@link ../docs/decisions/directive-type-validation.md}
 */

/**
 * @param {BuildGraphResult} graph
 * @param {PatramRepoConfig} repo_config
 * @param {PatramClaim[]} claims
 * @param {string[]} existing_file_paths
 * @returns {PatramDiagnostic[]}
 */
export function checkDirectiveMetadata(
  graph,
  repo_config,
  claims,
  existing_file_paths,
) {
  if (claims.length === 0 || !hasDirectiveValidationConfig(repo_config)) {
    return [];
  }

  const graph_config = resolvePatramGraphConfig(repo_config);
  const document_entity_keys = collectDocumentEntityKeys(
    graph_config.mappings,
    claims,
  );
  const document_node_references = collectDocumentNodeReferences(
    graph_config.mappings,
    claims,
  );
  const document_paths = new Set(
    existing_file_paths.map((file_path) =>
      normalizeRepoRelativePath(file_path),
    ),
  );
  const directive_claims_by_document = groupDirectiveClaimsByDocument(claims);
  /** @type {PatramDiagnostic[]} */
  const diagnostics = [];

  for (const document_path of [...directive_claims_by_document.keys()].sort()) {
    const document_claims = directive_claims_by_document.get(document_path);

    if (!document_claims) {
      continue;
    }

    collectDocumentDiagnostics(
      diagnostics,
      graph,
      graph_config.mappings,
      repo_config,
      document_path,
      document_claims,
      document_entity_keys,
      document_node_references,
      document_paths,
    );
  }

  return diagnostics;
}

/**
 * @param {PatramRepoConfig} repo_config
 * @returns {boolean}
 */
function hasDirectiveValidationConfig(repo_config) {
  return (
    repo_config.fields !== undefined ||
    hasConfiguredClassSchemas(repo_config) ||
    hasPathTargetDirectiveMappings(repo_config)
  );
}

/**
 * @param {PatramClaim[]} claims
 * @returns {Map<string, PatramClaim[]>}
 */
function groupDirectiveClaimsByDocument(claims) {
  /** @type {Map<string, PatramClaim[]>} */
  const directive_claims_by_document = new Map();

  for (const claim of claims) {
    if (claim.type !== 'directive') {
      continue;
    }

    const document_path = normalizeRepoRelativePath(claim.origin.path);
    let document_claims = directive_claims_by_document.get(document_path);

    if (!document_claims) {
      document_claims = [];
      directive_claims_by_document.set(document_path, document_claims);
    }

    document_claims.push(claim);
  }

  return directive_claims_by_document;
}

/**
 * @param {PatramDiagnostic[]} diagnostics
 * @param {BuildGraphResult} graph
 * @param {Record<string, MappingDefinition>} mappings
 * @param {PatramRepoConfig} repo_config
 * @param {string} document_path
 * @param {PatramClaim[]} document_claims
 * @param {Map<string, string>} document_entity_keys
 * @param {Map<string, import('./document-node-identity.js').DocumentNodeReference>} document_node_references
 * @param {Set<string>} document_paths
 */
function collectDocumentDiagnostics(
  diagnostics,
  graph,
  mappings,
  repo_config,
  document_path,
  document_claims,
  document_entity_keys,
  document_node_references,
  document_paths,
) {
  const document_kind = resolveDocumentKind(graph, document_path);
  const schema_definition = repo_config.classes?.[document_kind]?.schema;
  /** @type {Map<string, number>} */
  const directive_counts = new Map();

  for (const claim of document_claims) {
    if (!claim.name) {
      continue;
    }

    diagnostics.push(
      ...collectClaimDiagnostics(
        claim,
        mappings,
        repo_config,
        document_kind,
        schema_definition,
        directive_counts,
        document_entity_keys,
        document_node_references,
        document_paths,
      ),
    );
  }

  diagnostics.push(
    ...collectDocumentSummaryDiagnostics(
      repo_config,
      document_path,
      document_kind,
      schema_definition,
      directive_counts,
    ),
  );
}

/**
 * @param {PatramClaim} claim
 * @param {Record<string, MappingDefinition>} mappings
 * @param {PatramRepoConfig} repo_config
 * @param {string} document_kind
 * @param {MetadataSchemaConfig | undefined} schema_definition
 * @param {Map<string, number>} directive_counts
 * @param {Map<string, string>} document_entity_keys
 * @param {Map<string, import('./document-node-identity.js').DocumentNodeReference>} document_node_references
 * @param {Set<string>} document_paths
 * @returns {PatramDiagnostic[]}
 */
function collectClaimDiagnostics(
  claim,
  mappings,
  repo_config,
  document_kind,
  schema_definition,
  directive_counts,
  document_entity_keys,
  document_node_references,
  document_paths,
) {
  if (!claim.name) {
    return [];
  }

  const mapping_definition = resolveDirectiveMapping(mappings, claim);
  const validation_field_name = getDirectiveValidationFieldName(
    claim.name,
    mapping_definition,
  );
  const has_node_mapping = mapping_definition?.node !== undefined;
  const next_count = (directive_counts.get(claim.name) ?? 0) + 1;

  directive_counts.set(claim.name, next_count);

  return [
    ...collectPresenceDiagnostics(
      claim,
      claim.name,
      validation_field_name,
      isEmitOnlyDirective(mapping_definition),
      has_node_mapping,
      repo_config,
      document_kind,
      schema_definition,
      next_count,
    ),
    ...checkDirectiveValue(
      claim,
      claim.name,
      mappings,
      repo_config,
      schema_definition?.fields[claim.name],
      document_entity_keys,
      document_node_references,
      document_paths,
    ),
  ];
}

/**
 * @param {PatramRepoConfig} repo_config
 * @returns {boolean}
 */
function hasConfiguredClassSchemas(repo_config) {
  for (const class_definition of Object.values(repo_config.classes ?? {})) {
    if (class_definition.schema) {
      return true;
    }
  }

  return false;
}

/**
 * @param {PatramRepoConfig} repo_config
 * @returns {boolean}
 */
function hasPathTargetDirectiveMappings(repo_config) {
  for (const [mapping_name, mapping_definition] of Object.entries(
    repo_config.mappings ?? {},
  )) {
    if (
      mapping_name.includes('.directive.') &&
      mapping_definition.emit?.target === 'path'
    ) {
      return true;
    }
  }

  return false;
}

/**
 * @param {PatramRepoConfig} repo_config
 * @param {string} document_path
 * @param {string} document_kind
 * @param {MetadataSchemaConfig | undefined} schema_definition
 * @param {Map<string, number>} directive_counts
 * @returns {PatramDiagnostic[]}
 */
function collectDocumentSummaryDiagnostics(
  repo_config,
  document_path,
  document_kind,
  schema_definition,
  directive_counts,
) {
  return [
    ...collectMissingDirectiveDiagnostics(
      document_path,
      document_kind,
      schema_definition,
      directive_counts,
    ),
    ...collectPlacementDiagnostics(
      repo_config,
      document_path,
      document_kind,
      schema_definition,
    ),
  ];
}

/**
 * @param {PatramClaim} claim
 * @param {string} directive_name
 * @param {string} validation_field_name
 * @param {boolean} emit_only
 * @param {boolean} has_node_mapping
 * @param {PatramRepoConfig} repo_config
 * @param {string} document_kind
 * @param {MetadataSchemaConfig | undefined} schema_definition
 * @param {number} directive_count
 * @returns {PatramDiagnostic[]}
 */
function collectPresenceDiagnostics(
  claim,
  directive_name,
  validation_field_name,
  emit_only,
  has_node_mapping,
  repo_config,
  document_kind,
  schema_definition,
  directive_count,
) {
  const presence_context = resolveDirectivePresenceContext(
    validation_field_name,
    emit_only,
    has_node_mapping,
    repo_config,
    schema_definition,
  );

  if (presence_context === null) {
    return [];
  }

  const { directive_rule, field_definition } = presence_context;

  if (isForbiddenDirective(directive_rule, schema_definition)) {
    return [
      createOriginDiagnostic(
        claim,
        'directive.forbidden',
        `Directive "${directive_name}" is forbidden for class "${document_kind}".`,
      ),
    ];
  }

  if (field_definition?.multiple === true || directive_count <= 1) {
    return [];
  }

  return [
    createOriginDiagnostic(
      claim,
      'directive.duplicate',
      `Directive "${directive_name}" must appear at most once for class "${document_kind}".`,
    ),
  ];
}

/**
 * @param {{ presence: 'required' | 'optional' | 'forbidden' } | undefined} directive_rule
 * @param {MetadataSchemaConfig | undefined} schema_definition
 * @returns {boolean}
 */
function isForbiddenDirective(directive_rule, schema_definition) {
  return (
    directive_rule?.presence === 'forbidden' ||
    (directive_rule === undefined &&
      schema_definition?.unknown_fields === 'error')
  );
}

/**
 * @param {string} validation_field_name
 * @param {boolean} emit_only
 * @param {boolean} has_node_mapping
 * @param {PatramRepoConfig} repo_config
 * @param {MetadataSchemaConfig | undefined} schema_definition
 * @returns {{ directive_rule: ClassFieldRuleConfig | undefined, field_definition: MetadataFieldConfig | undefined } | null}
 */
function resolveDirectivePresenceContext(
  validation_field_name,
  emit_only,
  has_node_mapping,
  repo_config,
  schema_definition,
) {
  if (emit_only) {
    return null;
  }

  const directive_rule = schema_definition?.fields[validation_field_name];
  const field_definition = getDirectiveFieldDefinition(
    repo_config,
    validation_field_name,
  );

  if (
    !has_node_mapping &&
    directive_rule === undefined &&
    field_definition === undefined
  ) {
    return null;
  }

  return {
    directive_rule,
    field_definition,
  };
}

/**
 * @param {PatramRepoConfig} repo_config
 * @param {string} validation_field_name
 * @returns {MetadataFieldConfig | undefined}
 */
function getDirectiveFieldDefinition(repo_config, validation_field_name) {
  if (
    validation_field_name.startsWith('$') ||
    validation_field_name === 'title'
  ) {
    return undefined;
  }

  return repo_config.fields?.[validation_field_name];
}

/**
 * @param {BuildGraphResult} graph
 * @param {string} document_path
 * @returns {string}
 */
function resolveDocumentKind(graph, document_path) {
  const document_node_id = resolveDocumentNodeId(
    graph.document_node_ids,
    document_path,
  );

  return (
    graph.nodes[document_node_id]?.$class ??
    graph.nodes[document_node_id]?.kind ??
    'document'
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
 * @param {MappingDefinition | null} mapping_definition
 * @returns {boolean}
 */
function isEmitOnlyDirective(mapping_definition) {
  return (
    mapping_definition?.emit !== undefined &&
    mapping_definition.node === undefined
  );
}

/**
 * @param {string} document_path
 * @param {string} document_kind
 * @param {MetadataSchemaConfig | undefined} schema_definition
 * @param {Map<string, number>} directive_counts
 * @returns {PatramDiagnostic[]}
 */
function collectMissingDirectiveDiagnostics(
  document_path,
  document_kind,
  schema_definition,
  directive_counts,
) {
  if (!schema_definition) {
    return [];
  }

  /** @type {PatramDiagnostic[]} */
  const diagnostics = [];

  for (const [directive_name, directive_rule] of Object.entries(
    schema_definition.fields,
  )) {
    if (
      directive_rule.presence === 'required' &&
      (directive_counts.get(directive_name) ?? 0) === 0
    ) {
      diagnostics.push(
        createDocumentDiagnostic(
          document_path,
          'directive.missing_required',
          `Missing required directive "${directive_name}" for class "${document_kind}".`,
        ),
      );
    }
  }

  return diagnostics;
}

/**
 * @param {PatramRepoConfig} repo_config
 * @param {string} document_path
 * @param {string} document_kind
 * @param {MetadataSchemaConfig | undefined} schema_definition
 * @returns {PatramDiagnostic[]}
 */
function collectPlacementDiagnostics(
  repo_config,
  document_path,
  document_kind,
  schema_definition,
) {
  const document_path_class = schema_definition?.document_path_class;

  if (!document_path_class) {
    return [];
  }

  const path_class_definition = repo_config.path_classes?.[document_path_class];

  if (
    !path_class_definition ||
    path_class_definition.prefixes.some((prefix) =>
      document_path.startsWith(prefix),
    )
  ) {
    return [];
  }

  return [
    createDocumentDiagnostic(
      document_path,
      'document.invalid_placement',
      `Document class "${document_kind}" must be placed in path class "${document_path_class}".`,
    ),
  ];
}
