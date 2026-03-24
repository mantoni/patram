/* eslint-disable max-lines */
/**
 * @import { BuildGraphResult } from './build-graph.types.ts';
 * @import { MetadataSchemaConfig, PatramDiagnostic, PatramRepoConfig } from './load-patram-config.types.ts';
 * @import { PatramClaim } from './parse-claims.types.ts';
 * @import { MappingDefinition } from './patram-config.types.ts';
 */

import {
  collectDocumentEntityKeys,
  normalizeRepoRelativePath,
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
  if (
    claims.length === 0 ||
    (repo_config.fields === undefined &&
      repo_config.class_schemas === undefined)
  ) {
    return [];
  }

  const graph_config = resolvePatramGraphConfig(repo_config);
  const document_entity_keys = collectDocumentEntityKeys(
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
      document_paths,
    );
  }

  return diagnostics;
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
  document_paths,
) {
  const document_kind =
    graph.nodes[`doc:${document_path}`]?.$class ??
    graph.nodes[`doc:${document_path}`]?.kind ??
    'document';
  const schema_definition = repo_config.class_schemas?.[document_kind];
  /** @type {Map<string, number>} */
  const directive_counts = new Map();

  for (const claim of document_claims) {
    if (!claim.name) {
      continue;
    }

    const next_count = (directive_counts.get(claim.name) ?? 0) + 1;

    directive_counts.set(claim.name, next_count);
    diagnostics.push(
      ...collectPresenceDiagnostics(
        claim,
        claim.name,
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
        document_paths,
      ),
    );
  }

  diagnostics.push(
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
  );
}

/**
 * @param {PatramClaim} claim
 * @param {string} directive_name
 * @param {PatramRepoConfig} repo_config
 * @param {string} document_kind
 * @param {MetadataSchemaConfig | undefined} schema_definition
 * @param {number} directive_count
 * @returns {PatramDiagnostic[]}
 */
function collectPresenceDiagnostics(
  claim,
  directive_name,
  repo_config,
  document_kind,
  schema_definition,
  directive_count,
) {
  const directive_rule = schema_definition?.fields[directive_name];
  const field_definition = repo_config.fields?.[directive_name];

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
