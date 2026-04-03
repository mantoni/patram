/* eslint-disable max-lines */
/**
 * @import { BuildGraphResult, GraphNode } from '../graph/build-graph.types.ts';
 * @import { PatramClaim } from '../parse/parse-claims.types.ts';
 * @import { PatramDiagnostic } from '../config/load-patram-config.types.ts';
 */

import { readFile } from 'node:fs/promises';
import { posix, relative, resolve } from 'node:path';

import { resolveDocumentNodeId } from '../graph/build-graph-identity.js';
import {
  getGraphNodeClassName,
  getGraphNodeMetadataValue,
  getGraphNodePath,
} from '../graph/graph-node.js';
import { inspectReverseReferences } from '../graph/inspect-reverse-references.js';
import { parseSourceFile } from '../parse/parse-claims.js';

const MARKDOWN_HEADING_PATTERN = /^(#{1,6})\s+\S/du;
const MARKDOWN_LIST_ITEM_PATTERN = /^([ \t]*)(?:[-+*]|\d+\.)\s+/du;

/**
 * Show command document rendering.
 *
 * Loads one source file, resolves indexed links, and builds the shared show
 * output model.
 *
 * kind: output
 * status: active
 * tracked_in: ../../docs/plans/v0/source-anchor-dogfooding.md
 * decided_by: ../../docs/decisions/show-output.md
 * decided_by: ../../docs/decisions/source-rendering.md
 * @patram
 * @see {@link ./render-output-view.js}
 * @see {@link ../../docs/decisions/show-output.md}
 */

/**
 * @param {string} requested_file_path
 * @param {string} project_directory
 * @param {BuildGraphResult} graph
 * @returns {Promise<
 *   | {
 *       success: true;
 *       value: {
 *         incoming_summary: Record<string, number>;
 *         path: string;
 *         rendered_source: string;
 *         resolved_links: Array<{
 *           label: string;
 *           reference: number;
 *           target: { description?: string, kind?: string, path: string, status?: string, title: string };
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
      graph,
      graph.document_path_ids,
      graph.nodes,
    ),
  };
}

/**
 * @param {string} source_file_path
 * @param {string} source_text
 * @param {PatramClaim[]} claims
 * @param {BuildGraphResult} graph
 * @param {import('../graph/build-graph.types.ts').BuildGraphResult['document_path_ids']} document_path_ids
 * @param {Record<string, GraphNode>} graph_nodes
 * @returns {{ incoming_summary: Record<string, number>, path: string, rendered_source: string, resolved_links: Array<{ label: string, reference: number, target: { description?: string, kind?: string, path: string, status?: string, title: string } }>, source: string }}
 */
function createShowOutput(
  source_file_path,
  source_text,
  claims,
  graph,
  document_path_ids,
  graph_nodes,
) {
  const link_claims = claims.filter(isResolvedLinkClaim);
  const rendered_link_claims = link_claims.filter(isMarkdownLinkClaim);
  const resolved_links = link_claims.map((claim, claim_index) =>
    createResolvedLinkSummary(
      source_file_path,
      claim,
      claim_index + 1,
      document_path_ids,
      graph_nodes,
    ),
  );
  const reverse_references = inspectReverseReferences(
    graph,
    source_file_path,
    undefined,
    undefined,
  );

  return {
    incoming_summary: summarizeIncomingReferences(reverse_references.incoming),
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
 * @param {Array<{ label: string, reference: number, target: { description?: string, kind?: string, path: string, status?: string, title: string } }>} resolved_links
 * @returns {string}
 */
function renderResolvedSource(source_text, link_claims, resolved_links) {
  const source_lines = source_text.split('\n');
  const list_item_ranges = collectMarkdownListItemRanges(source_lines);
  const heading_boundaries = collectMarkdownHeadingBoundaries(source_lines);
  /** @type {Map<number, Array<{ column: number, marker: string, raw_link_length: number }>>} */
  const prose_markers = new Map();
  /** @type {Map<number, string[][]>} */
  const footnote_insertions = new Map();
  /** @type {Map<number, string[][]>} */
  const list_insertions = new Map();

  for (
    let claim_index = 0;
    claim_index < link_claims.length;
    claim_index += 1
  ) {
    const claim = link_claims[claim_index];
    const resolved_link = resolved_links[claim_index];

    if (!resolved_link) {
      continue;
    }

    const list_item_range = resolveMarkdownListItemRange(
      list_item_ranges,
      claim.origin.line,
    );

    if (list_item_range) {
      pushRenderedLinkInsertion(
        list_insertions,
        list_item_range.end_line + 1,
        createListResolvedLinkLines(resolved_link, list_item_range.indent),
      );
      continue;
    }

    const claim_value = getLinkClaimValue(claim);
    const raw_link = `[${claim_value.text}](${claim_value.target})`;
    const section_boundary = resolveSectionBoundaryLine(
      heading_boundaries,
      claim.origin.line,
      source_lines.length,
    );

    pushProseMarker(prose_markers, claim.origin.line, {
      column: claim.origin.column,
      marker: `[^${resolved_link.reference}]`,
      raw_link_length: raw_link.length,
    });
    pushRenderedLinkInsertion(
      footnote_insertions,
      section_boundary,
      createFootnoteResolvedLinkLines(resolved_link),
    );
  }

  applyProseMarkers(source_lines, prose_markers);

  return trimTrailingLineBreaks(
    renderResolvedSourceLines(
      source_lines,
      footnote_insertions,
      list_insertions,
    ).join('\n'),
  );
}

/**
 * @param {string} source_file_path
 * @param {PatramClaim} claim
 * @param {number} reference
 * @param {import('../graph/build-graph.types.ts').BuildGraphResult['document_path_ids']} document_path_ids
 * @param {Record<string, GraphNode>} graph_nodes
 * @returns {{ label: string, reference: number, target: { description?: string, kind?: string, path: string, status?: string, title: string } }}
 */
function createResolvedLinkSummary(
  source_file_path,
  claim,
  reference,
  document_path_ids,
  graph_nodes,
) {
  const claim_value = getLinkClaimValue(claim);
  const target_path = resolveShowTargetPath(
    source_file_path,
    claim_value.target,
  );
  const target_node =
    graph_nodes[resolveDocumentNodeId(document_path_ids, target_path)];

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
 * @returns {{ description?: string, kind?: string, path: string, status?: string, title: string }}
 */
function createResolvedLinkTarget(target_node, target_path, fallback_title) {
  /** @type {{ description?: string, kind?: string, path: string, status?: string, title: string }} */
  const resolved_target = {
    path: getResolvedLinkTargetPath(target_node, target_path),
    title:
      getScalarGraphField(getGraphNodeMetadataValue(target_node, 'title')) ??
      fallback_title,
  };
  const target_kind = getResolvedLinkTargetKind(target_node);
  const target_status = getScalarGraphField(
    getGraphNodeMetadataValue(target_node, 'status'),
  );

  if (target_kind) {
    resolved_target.kind = target_kind;
  }

  if (target_status) {
    resolved_target.status = target_status;
  }

  const target_description = getScalarGraphField(
    getGraphNodeMetadataValue(target_node, 'description'),
  );

  if (target_description) {
    resolved_target.description = target_description;
  }

  return resolved_target;
}

/**
 * @param {string[]} source_lines
 * @param {Map<number, string[][]>} footnote_insertions
 * @param {Map<number, string[][]>} list_insertions
 * @returns {string[]}
 */
function renderResolvedSourceLines(
  source_lines,
  footnote_insertions,
  list_insertions,
) {
  /** @type {string[]} */
  const rendered_lines = [];

  for (
    let insertion_line = 1;
    insertion_line <= source_lines.length + 1;
    insertion_line += 1
  ) {
    appendFootnoteInsertions(
      rendered_lines,
      footnote_insertions.get(insertion_line),
      source_lines[insertion_line - 1],
    );
    appendListInsertions(rendered_lines, list_insertions.get(insertion_line));

    if (insertion_line <= source_lines.length) {
      rendered_lines.push(source_lines[insertion_line - 1]);
    }
  }

  return rendered_lines;
}

/**
 * @param {Map<number, Array<{ column: number, marker: string, raw_link_length: number }>>} prose_markers
 * @param {number} line_number
 * @param {{ column: number, marker: string, raw_link_length: number }} prose_marker
 */
function pushProseMarker(prose_markers, line_number, prose_marker) {
  const line_markers = prose_markers.get(line_number) ?? [];

  line_markers.push(prose_marker);
  prose_markers.set(line_number, line_markers);
}

/**
 * @param {string[]} source_lines
 * @param {Map<number, Array<{ column: number, marker: string, raw_link_length: number }>>} prose_markers
 */
function applyProseMarkers(source_lines, prose_markers) {
  for (const [line_number, line_markers] of prose_markers.entries()) {
    const source_line = source_lines[line_number - 1];

    if (source_line === undefined) {
      continue;
    }

    source_lines[line_number - 1] = line_markers
      .slice()
      .sort(compareDescendingMarkerColumns)
      .reduce(insertProseMarkerIntoLine, source_line);
  }
}

/**
 * @param {string} source_line
 * @param {{ column: number, marker: string, raw_link_length: number }} prose_marker
 * @returns {string}
 */
function insertProseMarkerIntoLine(source_line, prose_marker) {
  const insertion_offset =
    prose_marker.column - 1 + prose_marker.raw_link_length;

  return `${source_line.slice(0, insertion_offset)}${prose_marker.marker}${source_line.slice(insertion_offset)}`;
}

/**
 * @param {{ column: number }} left_marker
 * @param {{ column: number }} right_marker
 * @returns {number}
 */
function compareDescendingMarkerColumns(left_marker, right_marker) {
  return right_marker.column - left_marker.column;
}

/**
 * @param {Map<number, string[][]>} insertions
 * @param {number} insertion_line
 * @param {string[]} insertion_lines
 */
function pushRenderedLinkInsertion(
  insertions,
  insertion_line,
  insertion_lines,
) {
  const rendered_insertions = insertions.get(insertion_line) ?? [];

  rendered_insertions.push(insertion_lines);
  insertions.set(insertion_line, rendered_insertions);
}

/**
 * @param {string[]} rendered_lines
 * @param {string[][] | undefined} footnote_blocks
 * @param {string | undefined} next_source_line
 */
function appendFootnoteInsertions(
  rendered_lines,
  footnote_blocks,
  next_source_line,
) {
  if (!footnote_blocks || footnote_blocks.length === 0) {
    return;
  }

  if (rendered_lines.at(-1)?.length) {
    rendered_lines.push('');
  }

  for (
    let block_index = 0;
    block_index < footnote_blocks.length;
    block_index += 1
  ) {
    if (block_index > 0) {
      rendered_lines.push('');
    }

    rendered_lines.push(...footnote_blocks[block_index]);
  }

  if (next_source_line && next_source_line.length > 0) {
    rendered_lines.push('');
  }
}

/**
 * @param {string[]} rendered_lines
 * @param {string[][] | undefined} list_blocks
 */
function appendListInsertions(rendered_lines, list_blocks) {
  if (!list_blocks || list_blocks.length === 0) {
    return;
  }

  for (const list_block of list_blocks) {
    rendered_lines.push(...list_block);
  }
}

/**
 * @param {{ reference: number, target: { description?: string, kind?: string, path: string, status?: string, title: string } }} resolved_link
 * @returns {string[]}
 */
function createFootnoteResolvedLinkLines(resolved_link) {
  return createRenderedLinkBlockLines(
    resolved_link,
    formatFootnoteResolvedLinkHeader(resolved_link),
    '    ',
  );
}

/**
 * @param {{ reference: number, target: { description?: string, kind?: string, path: string, status?: string, title: string } }} resolved_link
 * @param {string} item_indent
 * @returns {string[]}
 */
function createListResolvedLinkLines(resolved_link, item_indent) {
  return createRenderedLinkBlockLines(
    resolved_link,
    `${item_indent}-> ${formatListResolvedLinkHeader(resolved_link)}`,
    `${item_indent}   `,
  );
}

/**
 * @param {{ reference: number, target: { description?: string, kind?: string, path: string, status?: string, title: string } }} resolved_link
 * @param {string} header_line
 * @param {string} body_indent
 * @returns {string[]}
 */
function createRenderedLinkBlockLines(resolved_link, header_line, body_indent) {
  /** @type {string[]} */
  const block_lines = [
    header_line,
    `${body_indent}${resolved_link.target.title}`,
  ];

  if (resolved_link.target.description) {
    block_lines.push(`${body_indent}${resolved_link.target.description}`);
  }

  return block_lines;
}

/**
 * @param {{ target: { kind?: string, path: string, status?: string } }} resolved_link
 * @returns {string}
 */
function formatListResolvedLinkHeader(resolved_link) {
  const target_kind = resolved_link.target.kind ?? 'document';
  const metadata_label = resolved_link.target.status
    ? `  (status=${resolved_link.target.status})`
    : '';

  return `${target_kind} ${resolved_link.target.path}${metadata_label}`;
}

/**
 * @param {{ reference: number, target: { kind?: string, path: string, status?: string } }} resolved_link
 * @returns {string}
 */
function formatFootnoteResolvedLinkHeader(resolved_link) {
  const target_kind = resolved_link.target.kind ?? 'document';
  const metadata_label = resolved_link.target.status
    ? `  (status=${resolved_link.target.status})`
    : '';

  return `[^${resolved_link.reference}] ${target_kind} ${resolved_link.target.path}${metadata_label}`;
}

/**
 * @param {string[]} source_lines
 * @returns {Array<{ end_line: number, indent: string, start_line: number }>}
 */
function collectMarkdownListItemRanges(source_lines) {
  /** @type {Array<{ end_line: number, indent: string, start_line: number }>} */
  const list_item_ranges = [];

  for (let line_index = 0; line_index < source_lines.length; line_index += 1) {
    const source_line = source_lines[line_index];
    const list_item_match = source_line.match(MARKDOWN_LIST_ITEM_PATTERN);

    if (!list_item_match) {
      continue;
    }

    const marker_indent = list_item_match[1];
    let end_line = line_index + 1;

    for (
      let next_line_index = line_index + 1;
      next_line_index < source_lines.length;
      next_line_index += 1
    ) {
      const next_line = source_lines[next_line_index];

      if (next_line.length === 0) {
        end_line = next_line_index + 1;
        continue;
      }

      const next_item_match = next_line.match(MARKDOWN_LIST_ITEM_PATTERN);

      if (
        next_item_match &&
        next_item_match[1].length <= marker_indent.length
      ) {
        break;
      }

      if (getLeadingIndentLength(next_line) <= marker_indent.length) {
        break;
      }

      end_line = next_line_index + 1;
    }

    list_item_ranges.push({
      end_line,
      indent: `${marker_indent}  `,
      start_line: line_index + 1,
    });
  }

  return list_item_ranges;
}

/**
 * @param {Array<{ end_line: number, indent: string, start_line: number }>} list_item_ranges
 * @param {number} line_number
 * @returns {{ end_line: number, indent: string, start_line: number } | null}
 */
function resolveMarkdownListItemRange(list_item_ranges, line_number) {
  for (const list_item_range of list_item_ranges) {
    if (
      line_number >= list_item_range.start_line &&
      line_number <= list_item_range.end_line
    ) {
      return list_item_range;
    }
  }

  return null;
}

/**
 * @param {string[]} source_lines
 * @returns {Array<{ level: number, line: number }>}
 */
function collectMarkdownHeadingBoundaries(source_lines) {
  /** @type {Array<{ level: number, line: number }>} */
  const heading_boundaries = [];

  for (let line_index = 0; line_index < source_lines.length; line_index += 1) {
    const heading_match = source_lines[line_index].match(
      MARKDOWN_HEADING_PATTERN,
    );

    if (!heading_match) {
      continue;
    }

    heading_boundaries.push({
      level: heading_match[1].length,
      line: line_index + 1,
    });
  }

  return heading_boundaries;
}

/**
 * @param {Array<{ level: number, line: number }>} heading_boundaries
 * @param {number} line_number
 * @param {number} source_line_count
 * @returns {number}
 */
function resolveSectionBoundaryLine(
  heading_boundaries,
  line_number,
  source_line_count,
) {
  let current_heading_level = null;

  for (const heading_boundary of heading_boundaries) {
    if (heading_boundary.line >= line_number) {
      break;
    }

    current_heading_level = heading_boundary.level;
  }

  for (const heading_boundary of heading_boundaries) {
    if (heading_boundary.line <= line_number) {
      continue;
    }

    if (
      current_heading_level === null ||
      heading_boundary.level <= current_heading_level
    ) {
      return heading_boundary.line;
    }
  }

  return source_line_count + 1;
}

/**
 * @param {string} source_line
 * @returns {number}
 */
function getLeadingIndentLength(source_line) {
  return source_line.match(/^[ \t]*/du)?.[0].length ?? 0;
}

/**
 * @param {GraphNode | undefined} target_node
 * @returns {string | undefined}
 */
function getResolvedLinkTargetKind(target_node) {
  return getScalarGraphField(getGraphNodeClassName(target_node));
}

/**
 * @param {GraphNode | undefined} target_node
 * @param {string} target_path
 * @returns {string}
 */
function getResolvedLinkTargetPath(target_node, target_path) {
  return getScalarGraphField(getGraphNodePath(target_node)) ?? target_path;
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
 * @param {Record<string, GraphNode[]>} incoming
 * @returns {Record<string, number>}
 */
function summarizeIncomingReferences(incoming) {
  /** @type {Record<string, number>} */
  const incoming_summary = {};

  for (const relation_name of Object.keys(incoming)) {
    incoming_summary[relation_name] = incoming[relation_name].length;
  }

  return incoming_summary;
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
