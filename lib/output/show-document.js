/** @import * as $k$$k$$l$graph$l$document$j$node$j$identity$k$js from '../graph/document-node-identity.js'; */
/* eslint-disable max-lines */
/**
 * @import { BuildGraphResult, GraphNode } from '../graph/build-graph.types.ts';
 * @import { PatramRepoConfig } from '../config/load-patram-config.types.ts';
 * @import { PatramClaim } from '../parse/parse-claims.types.ts';
 * @import { PatramDiagnostic } from '../config/load-patram-config.types.ts';
 */

import { readFile } from 'node:fs/promises';
import { posix, relative, resolve } from 'node:path';

import { isPathLikeTarget } from '../parse/claim-helpers.js';
import {
  collectDocumentEntityKeys,
  collectDocumentNodeReferences,
  resolveDocumentNodeId,
  resolveTargetReference,
} from '../graph/build-graph-identity.js';
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
 * @param {{ project_claims?: PatramClaim[], repo_config?: PatramRepoConfig }} [show_options]
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
 *           source?: { claim_type: 'directive', column: number, line: number, parser?: string, raw_target: string };
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
  show_options = {},
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
      show_options.repo_config,
      show_options.project_claims,
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
 * @param {PatramRepoConfig | undefined} repo_config
 * @param {PatramClaim[] | undefined} project_claims
 * @returns {{ incoming_summary: Record<string, number>, path: string, rendered_source: string, resolved_links: Array<{ label: string, reference: number, source?: { claim_type: 'directive', column: number, line: number, parser?: string, raw_target: string }, target: { description?: string, kind?: string, path: string, status?: string, title: string } }>, source: string }}
 */
function createShowOutput(
  source_file_path,
  source_text,
  claims,
  graph,
  document_path_ids,
  graph_nodes,
  repo_config,
  project_claims,
) {
  const resolution_context = createShowResolutionContext(
    repo_config,
    project_claims ?? claims,
    graph,
  );
  const resolved_reference_claims = claims.filter((claim) =>
    isResolvedReferenceClaim(claim, repo_config),
  );
  const resolved_links = resolved_reference_claims.map((claim, claim_index) =>
    createResolvedLinkSummary(
      claim,
      claim_index + 1,
      document_path_ids,
      graph_nodes,
      repo_config,
      resolution_context,
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
      resolved_reference_claims,
      resolved_links,
    ),
    resolved_links,
    source: source_text,
  };
}

/**
 * @param {string} source_text
 * @param {PatramClaim[]} resolved_reference_claims
 * @param {Array<{ label: string, reference: number, source?: { claim_type: 'directive', column: number, line: number, parser?: string, raw_target: string }, target: { description?: string, kind?: string, path: string, status?: string, title: string } }>} resolved_links
 * @returns {string}
 */
function renderResolvedSource(
  source_text,
  resolved_reference_claims,
  resolved_links,
) {
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
    claim_index < resolved_reference_claims.length;
    claim_index += 1
  ) {
    const claim = resolved_reference_claims[claim_index];
    const resolved_link = resolved_links[claim_index];

    if (!resolved_link) {
      continue;
    }

    appendResolvedSourceAnnotation({
      claim,
      footnote_insertions,
      heading_boundaries,
      list_insertions,
      list_item_ranges,
      prose_markers,
      resolved_link,
      source_lines,
    });
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
 * @param {{
 *   claim: PatramClaim,
 *   footnote_insertions: Map<number, string[][]>,
 *   heading_boundaries: Array<{ level: number, line: number }>,
 *   list_insertions: Map<number, string[][]>,
 *   list_item_ranges: Array<{ end_line: number, indent: string, start_line: number }>,
 *   prose_markers: Map<number, Array<{ column: number, marker: string, raw_link_length: number }>>,
 *   resolved_link: { label: string, reference: number, source?: { claim_type: 'directive', column: number, line: number, parser?: string, raw_target: string }, target: { description?: string, kind?: string, path: string, status?: string, title: string } },
 *   source_lines: string[],
 * }} render_context
 */
function appendResolvedSourceAnnotation(render_context) {
  const list_item_range = resolveMarkdownListItemRange(
    render_context.list_item_ranges,
    render_context.claim.origin.line,
  );

  if (list_item_range) {
    pushRenderedLinkInsertion(
      render_context.list_insertions,
      resolveListInsertionLine(render_context.source_lines, list_item_range),
      createListResolvedLinkLines(
        render_context.resolved_link,
        list_item_range.indent,
      ),
    );
    return;
  }

  const prose_marker = createProseMarker(
    render_context.claim,
    render_context.resolved_link,
    render_context.source_lines,
  );

  if (!prose_marker) {
    return;
  }

  const section_boundary = resolveSectionBoundaryLine(
    render_context.heading_boundaries,
    render_context.claim.origin.line,
    render_context.source_lines.length,
  );

  pushProseMarker(
    render_context.prose_markers,
    render_context.claim.origin.line,
    prose_marker,
  );
  pushRenderedLinkInsertion(
    render_context.footnote_insertions,
    section_boundary,
    createFootnoteResolvedLinkLines(render_context.resolved_link),
  );
}

/**
 * @param {PatramClaim} claim
 * @param {number} reference
 * @param {import('../graph/build-graph.types.ts').BuildGraphResult['document_path_ids']} document_path_ids
 * @param {Record<string, GraphNode>} graph_nodes
 * @param {PatramRepoConfig | undefined} repo_config
 * @param {{ document_entity_keys: Map<string, string>, document_node_references: Map<string, import('../graph/document-node-identity.js').DocumentNodeReference>, document_paths: Set<string> }} resolution_context
 * @returns {{ label: string, reference: number, source?: { claim_type: 'directive', column: number, line: number, parser?: string, raw_target: string }, target: { description?: string, kind?: string, path: string, status?: string, title: string } }}
 */
function createResolvedLinkSummary(
  claim,
  reference,
  document_path_ids,
  graph_nodes,
  repo_config,
  resolution_context,
) {
  const target_reference = resolveTargetReference(
    getResolvedReferenceTargetClass(claim, repo_config),
    'path',
    claim,
    resolution_context.document_entity_keys,
    resolution_context.document_node_references,
    resolution_context.document_paths,
  );
  const target_path = target_reference.path;

  if (!target_path) {
    throw new Error(`Claim "${claim.id}" did not resolve to a target path.`);
  }

  const target_node =
    graph_nodes[resolveDocumentNodeId(document_path_ids, target_path)];
  /** @type {{ label: string, reference: number, source?: { claim_type: 'directive', column: number, line: number, parser?: string, raw_target: string }, target: { description?: string, kind?: string, path: string, status?: string, title: string } }} */
  const resolved_link = {
    label: getResolvedReferenceLabel(claim),
    reference,
    target: createResolvedLinkTarget(
      target_node,
      target_path,
      getResolvedReferenceFallbackTitle(claim),
    ),
  };

  if (claim.type === 'directive' && typeof claim.value === 'string') {
    resolved_link.source = {
      claim_type: 'directive',
      column: claim.origin.column,
      line: claim.origin.line,
      parser: claim.parser,
      raw_target: claim.value,
    };
  }

  return resolved_link;
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
 * @param {{ end_line: number, indent: string, start_line: number }} list_item_range
 * @returns {number}
 */
function resolveListInsertionLine(source_lines, list_item_range) {
  return source_lines[list_item_range.end_line - 1]?.length === 0
    ? list_item_range.end_line
    : list_item_range.end_line + 1;
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
 * @param {PatramRepoConfig | undefined} repo_config
 * @returns {boolean}
 */
function isResolvedReferenceClaim(claim, repo_config) {
  if (claim.type === 'markdown.link' || claim.type === 'jsdoc.link') {
    return true;
  }

  return isResolvedDirectiveReferenceClaim(claim, repo_config);
}

/**
 * @param {PatramClaim} claim
 * @param {PatramRepoConfig | undefined} repo_config
 * @returns {boolean}
 */
function isResolvedDirectiveReferenceClaim(claim, repo_config) {
  if (
    claim.type !== 'directive' ||
    typeof claim.value !== 'string' ||
    !claim.name ||
    !isPathLikeTarget(claim.value)
  ) {
    return false;
  }

  const field_definition = repo_config?.fields?.[claim.name];

  return field_definition?.type === 'path' || field_definition?.type === 'ref';
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
 * @param {PatramRepoConfig | undefined} repo_config
 * @param {PatramClaim[]} project_claims
 * @param {BuildGraphResult} graph
 * @returns {{document_entity_keys: Map<string, string>, document_node_references: Map<string, $k$$k$$l$graph$l$document$j$node$j$identity$k$js.DocumentNodeReference>, document_paths: Set<string>}}
 */
function createShowResolutionContext(repo_config, project_claims, graph) {
  const normalized_repo_config = repo_config ?? {
    include: [],
    queries: {},
  };
  const document_node_references = collectDocumentNodeReferences(
    normalized_repo_config,
    project_claims,
  );
  /** @type {Set<string>} */
  const document_paths = new Set([
    ...Object.keys(graph.document_path_ids ?? {}),
    ...document_node_references.keys(),
  ]);

  return {
    document_entity_keys: collectDocumentEntityKeys(
      normalized_repo_config,
      project_claims,
    ),
    document_node_references,
    document_paths,
  };
}

/**
 * @param {PatramClaim} claim
 * @param {{ label: string, reference: number, source?: { claim_type: 'directive', column: number, line: number, parser?: string, raw_target: string }, target: { description?: string, kind?: string, path: string, status?: string, title: string } }} resolved_link
 * @param {string[]} source_lines
 * @returns {{ column: number, marker: string, raw_link_length: number } | null}
 */
function createProseMarker(claim, resolved_link, source_lines) {
  if (claim.type === 'markdown.link' || claim.type === 'jsdoc.link') {
    const claim_value = getLinkClaimValue(claim);
    const raw_link = `[${claim_value.text}](${claim_value.target})`;

    return {
      column: claim.origin.column,
      marker: `[^${resolved_link.reference}]`,
      raw_link_length: raw_link.length,
    };
  }

  if (claim.type !== 'directive' || typeof claim.value !== 'string') {
    return null;
  }

  const source_line = source_lines[claim.origin.line - 1];

  if (source_line === undefined) {
    return null;
  }

  const target_column = resolveDirectiveTargetColumn(
    source_line,
    claim.origin.column,
    claim.value,
  );

  if (target_column === null) {
    return null;
  }

  return {
    column: target_column,
    marker: `[^${resolved_link.reference}]`,
    raw_link_length: claim.value.length,
  };
}

/**
 * @param {string} source_line
 * @param {number} line_column
 * @param {string} raw_target
 * @returns {number | null}
 */
function resolveDirectiveTargetColumn(source_line, line_column, raw_target) {
  const target_index = source_line.indexOf(raw_target, line_column - 1);

  if (target_index < 0) {
    return null;
  }

  return target_index + 1;
}

/**
 * @param {PatramClaim} claim
 * @param {PatramRepoConfig | undefined} repo_config
 * @returns {string}
 */
function getResolvedReferenceTargetClass(claim, repo_config) {
  if (claim.type !== 'directive') {
    return 'document';
  }

  const field_definition = claim.name
    ? repo_config?.fields?.[claim.name]
    : undefined;

  return field_definition?.type === 'ref' ? field_definition.to : 'document';
}

/**
 * @param {PatramClaim} claim
 * @returns {string}
 */
function getResolvedReferenceLabel(claim) {
  if (claim.type === 'directive') {
    return claim.name ?? 'directive';
  }

  return getLinkClaimValue(claim).text;
}

/**
 * @param {PatramClaim} claim
 * @returns {string}
 */
function getResolvedReferenceFallbackTitle(claim) {
  if (claim.type === 'directive' && typeof claim.value === 'string') {
    return claim.value;
  }

  return getLinkClaimValue(claim).text;
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
