/* eslint-disable max-lines */
/**
 * @import { GraphNode } from './build-graph.types.ts';
 * @import { PatramClaim } from './parse-claims.types.ts';
 * @import { PatramDiagnostic } from './load-patram-config.types.ts';
 */

import { readFile } from 'node:fs/promises';
import { posix, relative, resolve } from 'node:path';

import { parseSourceFile } from './parse-claims.js';

/**
 * Show command document rendering.
 *
 * Loads one source file, resolves indexed links, and builds the shared show
 * output model.
 *
 * Kind: output
 * Status: active
 * Tracked in: ../docs/plans/v0/source-anchor-dogfooding.md
 * Decided by: ../docs/decisions/show-output.md
 * Decided by: ../docs/decisions/source-rendering.md
 * @patram
 * @see {@link ./render-output-view.js}
 * @see {@link ../docs/decisions/show-output.md}
 */

/**
 * @param {string} requested_file_path
 * @param {string} project_directory
 * @param {import('./build-graph.types.ts').BuildGraphResult} graph
 * @returns {Promise<
 *   | {
 *       success: true;
 *       value: {
 *         path: string;
 *         rendered_source: string;
 *         resolved_links: Array<{
 *           label: string;
 *           reference: number;
 *           target: { kind?: string, path: string, status?: string, title: string };
 *         }>;
 *         source: string;
 *       };
 *     }
 *   | {
 *       diagnostic: PatramDiagnostic;
 *       success: false;
 *     }
 * >}
 */
export async function loadShowOutput(
  requested_file_path,
  project_directory,
  graph,
) {
  const absolute_source_path = resolve(project_directory, requested_file_path);
  const source_file_path = normalizeRepoRelativePath(
    relative(project_directory, absolute_source_path),
  );
  let source_text;

  try {
    source_text = await readFile(absolute_source_path, 'utf8');
  } catch (error) {
    if (isFileNotFoundError(error)) {
      return {
        diagnostic: createShowFileNotFoundDiagnostic(source_file_path),
        success: false,
      };
    }

    throw error;
  }

  const parse_result = parseSourceFile({
    path: source_file_path,
    source: source_text,
  });

  if (parse_result.diagnostics.length > 0) {
    return {
      diagnostic: parse_result.diagnostics[0],
      success: false,
    };
  }

  return {
    success: true,
    value: createShowOutput(
      source_file_path,
      source_text,
      parse_result.claims,
      graph.nodes,
    ),
  };
}

/**
 * @param {string} source_file_path
 * @param {string} source_text
 * @param {PatramClaim[]} claims
 * @param {Record<string, GraphNode>} graph_nodes
 * @returns {{ path: string, rendered_source: string, resolved_links: Array<{ label: string, reference: number, target: { kind?: string, path: string, status?: string, title: string } }>, source: string }}
 */
function createShowOutput(source_file_path, source_text, claims, graph_nodes) {
  const link_claims = claims.filter(isResolvedLinkClaim);
  const rendered_link_claims = link_claims.filter(isMarkdownLinkClaim);
  const resolved_links = link_claims.map((claim, claim_index) =>
    createResolvedLinkSummary(
      source_file_path,
      claim,
      claim_index + 1,
      graph_nodes,
    ),
  );

  return {
    path: source_file_path,
    rendered_source: renderResolvedSource(
      source_text,
      rendered_link_claims,
      resolved_links,
    ),
    resolved_links,
    source: source_text,
  };
}

/**
 * @param {string} source_text
 * @param {PatramClaim[]} link_claims
 * @param {Array<{ label: string, reference: number }>} resolved_links
 * @returns {string}
 */
function renderResolvedSource(source_text, link_claims, resolved_links) {
  const source_lines = source_text.split('\n');

  return trimTrailingLineBreaks(
    source_lines
      .map((source_line, line_index) =>
        renderResolvedSourceLine(
          source_line,
          line_index + 1,
          link_claims,
          resolved_links,
        ),
      )
      .join('\n'),
  );
}

/**
 * @param {string} source_line
 * @param {number} line_number
 * @param {PatramClaim[]} link_claims
 * @param {Array<{ label: string, reference: number }>} resolved_links
 * @returns {string}
 */
function renderResolvedSourceLine(
  source_line,
  line_number,
  link_claims,
  resolved_links,
) {
  const line_link_claims = link_claims.filter(
    (claim) => claim.origin.line === line_number,
  );

  if (line_link_claims.length === 0) {
    return source_line;
  }

  /** @type {string[]} */
  const chunks = [];
  let source_offset = 0;

  for (const claim of line_link_claims) {
    const claim_index = link_claims.indexOf(claim);
    const claim_value = getLinkClaimValue(claim);
    const rendered_link = resolved_links[claim_index];
    const claim_column = claim.origin.column - 1;
    const raw_link = `[${claim_value.text}](${claim_value.target})`;

    chunks.push(source_line.slice(source_offset, claim_column));
    chunks.push(`[${rendered_link.label}][${rendered_link.reference}]`);
    source_offset = claim_column + raw_link.length;
  }

  chunks.push(source_line.slice(source_offset));

  return chunks.join('');
}

/**
 * @param {string} source_file_path
 * @param {PatramClaim} claim
 * @param {number} reference
 * @param {Record<string, GraphNode>} graph_nodes
 * @returns {{ label: string, reference: number, target: { kind?: string, path: string, status?: string, title: string } }}
 */
function createResolvedLinkSummary(
  source_file_path,
  claim,
  reference,
  graph_nodes,
) {
  const claim_value = getLinkClaimValue(claim);
  const target_path = resolveShowTargetPath(
    source_file_path,
    claim_value.target,
  );
  const target_node = graph_nodes[`doc:${target_path}`];

  return {
    label: claim_value.text,
    reference,
    target: createResolvedLinkTarget(
      target_node,
      target_path,
      claim_value.text,
    ),
  };
}

/**
 * @param {string} source_file_path
 * @param {string} raw_target
 * @returns {string}
 */
function resolveShowTargetPath(source_file_path, raw_target) {
  const source_directory = posix.dirname(
    normalizeRepoRelativePath(source_file_path),
  );

  return normalizeRepoRelativePath(posix.join(source_directory, raw_target));
}

/**
 * @param {string | string[] | undefined} field_value
 * @returns {string | undefined}
 */
function getScalarGraphField(field_value) {
  if (Array.isArray(field_value)) {
    return field_value[0];
  }

  return field_value;
}

/**
 * @param {GraphNode | undefined} target_node
 * @param {string} target_path
 * @param {string} fallback_title
 * @returns {{ kind?: string, path: string, status?: string, title: string }}
 */
function createResolvedLinkTarget(target_node, target_path, fallback_title) {
  return {
    kind: getResolvedLinkTargetKind(target_node),
    path: getResolvedLinkTargetPath(target_node, target_path),
    status: getScalarGraphField(target_node?.status),
    title: getScalarGraphField(target_node?.title) ?? fallback_title,
  };
}

/**
 * @param {GraphNode | undefined} target_node
 * @returns {string | undefined}
 */
function getResolvedLinkTargetKind(target_node) {
  return getScalarGraphField(target_node?.$class ?? target_node?.kind);
}

/**
 * @param {GraphNode | undefined} target_node
 * @param {string} target_path
 * @returns {string}
 */
function getResolvedLinkTargetPath(target_node, target_path) {
  return (
    getScalarGraphField(target_node?.$path ?? target_node?.path) ?? target_path
  );
}

/**
 * @param {PatramClaim} claim
 * @returns {claim is PatramClaim & { type: 'markdown.link', value: { target: string, text: string } }}
 */
function isMarkdownLinkClaim(claim) {
  return claim.type === 'markdown.link';
}

/**
 * @param {PatramClaim} claim
 * @returns {claim is PatramClaim & { type: 'jsdoc.link' | 'markdown.link', value: { target: string, text: string } }}
 */
function isResolvedLinkClaim(claim) {
  return claim.type === 'markdown.link' || claim.type === 'jsdoc.link';
}

/**
 * @param {PatramClaim} claim
 * @returns {{ target: string, text: string }}
 */
function getLinkClaimValue(claim) {
  if (typeof claim.value === 'string') {
    throw new Error(`Expected claim "${claim.id}" to carry a markdown link.`);
  }

  return claim.value;
}

/**
 * @param {string} source_path
 * @returns {string}
 */
function normalizeRepoRelativePath(source_path) {
  return posix.normalize(source_path.replaceAll('\\', '/'));
}

/**
 * @param {string} source_file_path
 * @returns {PatramDiagnostic}
 */
function createShowFileNotFoundDiagnostic(source_file_path) {
  return {
    code: 'show.file_not_found',
    column: 1,
    level: 'error',
    line: 1,
    message: `File "${source_file_path}" was not found.`,
    path: source_file_path,
  };
}

/**
 * @param {string} value
 * @returns {string}
 */
function trimTrailingLineBreaks(value) {
  return value.replace(/\n+$/du, '');
}

/**
 * @param {unknown} error
 * @returns {error is NodeJS.ErrnoException}
 */
function isFileNotFoundError(error) {
  if (!(error instanceof Error)) {
    return false;
  }

  return 'code' in error && error.code === 'ENOENT';
}
