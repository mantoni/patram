/**
 * @import { GraphNode } from './build-graph.types.ts';
 * @import { PatramClaim } from './parse-claims.types.ts';
 * @import { PatramDiagnostic } from './load-patram-config.types.ts';
 */

import { readFile } from 'node:fs/promises';
import { posix, relative, resolve } from 'node:path';

import { parseClaims } from './parse-claims.js';

/**
 * @param {string} requested_file_path
 * @param {string} project_directory
 * @param {import('./build-graph.types.ts').BuildGraphResult} graph
 * @returns {Promise<
 *   | {
 *       success: true;
 *       value: {
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

  return {
    success: true,
    value: createShowOutput(source_file_path, source_text, graph.nodes),
  };
}

/**
 * @param {string} source_file_path
 * @param {string} source_text
 * @param {Record<string, GraphNode>} graph_nodes
 * @returns {{ rendered_source: string, resolved_links: Array<{ label: string, reference: number, target: { kind?: string, path: string, status?: string, title: string } }>, source: string }}
 */
function createShowOutput(source_file_path, source_text, graph_nodes) {
  const claims = parseClaims({
    path: source_file_path,
    source: source_text,
  });
  const link_claims = claims.filter(isMarkdownLinkClaim);
  const resolved_links = link_claims.map((claim, claim_index) =>
    createResolvedLinkSummary(
      source_file_path,
      claim,
      claim_index + 1,
      graph_nodes,
    ),
  );

  return {
    rendered_source: renderResolvedSource(
      source_text,
      link_claims,
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
  const target_title = target_node?.title ?? claim_value.text;

  return {
    label: claim_value.text,
    reference,
    target: {
      kind: target_node?.kind,
      path: target_node?.path ?? target_path,
      status: target_node?.status,
      title: target_title,
    },
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
 * @param {PatramClaim} claim
 * @returns {claim is PatramClaim & { type: 'markdown.link', value: { target: string, text: string } }}
 */
function isMarkdownLinkClaim(claim) {
  return claim.type === 'markdown.link';
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
