/**
 * @import { BuildGraphResult } from './build-graph.types.ts';
 * @import { PatramDiagnostic, PatramRepoConfig } from '../config/load-patram-config.types.ts';
 * @import { PatramClaim } from '../parse/parse-claims.types.ts';
 */

import {
  collectDocumentEntityKeys,
  collectDocumentNodeReferences,
  normalizeRepoRelativePath,
} from './build-graph-identity.js';
import { checkDirectiveValue } from './check-directive-value.js';
import {
  collectRequiredFieldDiagnostics,
  collectTypePlacementDiagnostics,
  groupDirectiveClaimsByDocument,
  resolveDocumentType,
} from './check-directive-metadata-helpers.js';
import { createOriginDiagnostic } from './directive-diagnostics.js';

/**
 * Validate declared metadata fields and typed document placement.
 *
 * kind: graph
 * status: active
 * tracked_in: ../../docs/plans/v2/types-and-fields-config.md
 * decided_by: ../../docs/decisions/types-and-fields-config.md
 * @patram
 * @see {@link ./check-directive-value.js}
 * @see {@link ../../docs/decisions/types-and-fields-config.md}
 *
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
  if (claims.length === 0) {
    return [];
  }

  const document_entity_keys = collectDocumentEntityKeys(repo_config, claims);
  const document_node_references = collectDocumentNodeReferences(
    repo_config,
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

    diagnostics.push(
      ...checkDocumentDirectiveMetadata(
        graph,
        repo_config,
        document_path,
        document_claims,
        document_entity_keys,
        document_node_references,
        document_paths,
      ),
    );
  }

  return diagnostics;
}

/**
 * @param {BuildGraphResult} graph
 * @param {PatramRepoConfig} repo_config
 * @param {string} document_path
 * @param {PatramClaim[]} document_claims
 * @param {Map<string, string>} document_entity_keys
 * @param {Map<string, import('./document-node-identity.js').DocumentNodeReference>} document_node_references
 * @param {Set<string>} document_paths
 * @returns {PatramDiagnostic[]}
 */
function checkDocumentDirectiveMetadata(
  graph,
  repo_config,
  document_path,
  document_claims,
  document_entity_keys,
  document_node_references,
  document_paths,
) {
  const document_type = resolveDocumentType(graph, document_path);
  /** @type {Map<string, number>} */
  const directive_counts = new Map();
  /** @type {PatramDiagnostic[]} */
  const diagnostics = [];

  for (const claim of document_claims) {
    if (!claim.name) {
      continue;
    }

    directive_counts.set(
      claim.name,
      (directive_counts.get(claim.name) ?? 0) + 1,
    );
    diagnostics.push(
      ...collectClaimDiagnostics(
        claim,
        repo_config,
        document_type,
        document_entity_keys,
        document_node_references,
        document_paths,
      ),
    );
  }

  diagnostics.push(
    ...collectRequiredFieldDiagnostics(
      repo_config,
      document_path,
      document_type,
      directive_counts,
    ),
  );
  diagnostics.push(
    ...collectTypePlacementDiagnostics(
      repo_config,
      document_path,
      document_type,
    ),
  );

  return diagnostics;
}

/**
 * @param {PatramClaim} claim
 * @param {PatramRepoConfig} repo_config
 * @param {string} document_type
 * @param {Map<string, string>} document_entity_keys
 * @param {Map<string, import('./document-node-identity.js').DocumentNodeReference>} document_node_references
 * @param {Set<string>} document_paths
 * @returns {PatramDiagnostic[]}
 */
function collectClaimDiagnostics(
  claim,
  repo_config,
  document_type,
  document_entity_keys,
  document_node_references,
  document_paths,
) {
  if (!claim.name) {
    return [];
  }

  if (claim.name === 'title' || claim.name === 'description') {
    return checkDirectiveValue(
      claim,
      claim.name,
      repo_config,
      document_entity_keys,
      document_node_references,
      document_paths,
    );
  }

  const field_definition = repo_config.fields?.[claim.name];

  if (!field_definition) {
    return [
      createOriginDiagnostic(
        claim,
        'directive.unknown_field',
        `Directive "${claim.name}" is not declared in config.`,
      ),
    ];
  }

  if (field_definition.on && !field_definition.on.includes(document_type)) {
    return [
      createOriginDiagnostic(
        claim,
        'directive.invalid_type_scope',
        `Directive "${claim.name}" is not allowed on type "${document_type}".`,
      ),
    ];
  }

  return checkDirectiveValue(
    claim,
    claim.name,
    repo_config,
    document_entity_keys,
    document_node_references,
    document_paths,
  );
}
