/**
 * @import { BuildGraphResult } from './build-graph.types.ts';
 * @import { PatramDiagnostic, PatramRepoConfig } from '../config/load-patram-config.types.ts';
 * @import { PatramClaim } from '../parse/parse-claims.types.ts';
 */

import { matchesGlob } from 'node:path';

import {
  normalizeRepoRelativePath,
  resolveDocumentNodeId,
} from './build-graph-identity.js';
import { createDocumentDiagnostic } from './directive-diagnostics.js';
import { getGraphNodeClassName } from './graph-node.js';

/**
 * @param {PatramClaim[]} claims
 * @returns {Map<string, PatramClaim[]>}
 */
export function groupDirectiveClaimsByDocument(claims) {
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
 * @param {PatramRepoConfig} repo_config
 * @param {string} document_path
 * @param {string} document_type
 * @param {Map<string, number>} directive_counts
 * @returns {PatramDiagnostic[]}
 */
export function collectRequiredFieldDiagnostics(
  repo_config,
  document_path,
  document_type,
  directive_counts,
) {
  /** @type {PatramDiagnostic[]} */
  const diagnostics = [];

  for (const [field_name, field_definition] of Object.entries(
    repo_config.fields ?? {},
  )) {
    if (!field_definition.required_on?.includes(document_type)) {
      continue;
    }

    if ((directive_counts.get(field_name) ?? 0) > 0) {
      continue;
    }

    diagnostics.push(
      createDocumentDiagnostic(
        document_path,
        'directive.missing_required_field',
        `Type "${document_type}" requires directive "${field_name}".`,
      ),
    );
  }

  return diagnostics;
}

/**
 * @param {PatramRepoConfig} repo_config
 * @param {string} document_path
 * @param {string} document_type
 * @returns {PatramDiagnostic[]}
 */
export function collectTypePlacementDiagnostics(
  repo_config,
  document_path,
  document_type,
) {
  const type_definition = repo_config.types?.[document_type];

  if (!type_definition?.in || document_type === 'document') {
    return [];
  }

  const patterns = Array.isArray(type_definition.in)
    ? type_definition.in
    : [type_definition.in];

  if (patterns.some((pattern) => matchesGlob(document_path, pattern))) {
    return [];
  }

  return [
    createDocumentDiagnostic(
      document_path,
      'directive.invalid_type_placement',
      `Type "${document_type}" must be placed under one of its configured "in" globs.`,
    ),
  ];
}

/**
 * @param {BuildGraphResult} graph
 * @param {string} document_path
 * @returns {string}
 */
export function resolveDocumentType(graph, document_path) {
  const document_node =
    graph.nodes[resolveDocumentNodeId(graph.document_path_ids, document_path)];

  return getGraphNodeClassName(document_node) ?? 'document';
}
