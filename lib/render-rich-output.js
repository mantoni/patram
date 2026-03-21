/**
 * @import { CliColorMode } from './parse-cli-arguments.types.ts';
 * @import { OutputNodeItem, OutputResolvedLinkItem, OutputStoredQueryItem, OutputView, QueryOutputView, ShowOutputView } from './output-view.types.ts';
 */

import { Ansis } from 'ansis';

import { layoutStoredQueries } from './layout-stored-queries.js';
import { renderRichSource } from './render-rich-source.js';

const FULL_WIDTH_DIVIDER = ` ${'─'.repeat(78)} `;

/**
 * Render styled rich output while preserving the plain layout.
 *
 * @param {OutputView} output_view
 * @param {{ color_mode: CliColorMode, color_enabled: boolean }} render_options
 * @returns {Promise<string>}
 */
export async function renderRichOutput(output_view, render_options) {
  const ansi = createAnsi(render_options.color_enabled);

  if (output_view.command === 'query') {
    return renderRichQueryOutput(output_view, ansi);
  }

  if (output_view.command === 'queries') {
    return renderRichStoredQueries(output_view.items, ansi);
  }

  if (output_view.command === 'show') {
    return renderRichShowOutput(output_view, render_options, ansi);
  }

  throw new Error('Unsupported output view command.');
}

/**
 * @param {QueryOutputView} output_view
 * @param {Ansis} ansi
 * @returns {string}
 */
function renderRichQueryOutput(output_view, ansi) {
  const footer = renderRichQueryFooter(
    output_view.summary,
    output_view.hints,
    ansi,
  );

  if (output_view.items.length === 0) {
    return renderRichEmptyQuery(footer, ansi);
  }

  if (footer.length === 0) {
    return `${output_view.items.map((item) => formatRichNodeItem(item, ansi)).join('\n\n')}\n`;
  }

  return `${output_view.items.map((item) => formatRichNodeItem(item, ansi)).join('\n\n')}\n\n${footer}\n`;
}

/**
 * @param {string} footer
 * @param {Ansis} ansi
 * @returns {string}
 */
function renderRichEmptyQuery(footer, ansi) {
  if (footer.length === 0) {
    return `${ansi.yellow('No matches.')}\n`;
  }

  return `${ansi.yellow('No matches.')}\n${footer}\n`;
}

/**
 * @param {OutputStoredQueryItem[]} output_items
 * @param {Ansis} ansi
 * @returns {string}
 */
function renderRichStoredQueries(output_items, ansi) {
  if (output_items.length === 0) {
    return '';
  }

  return `${layoutStoredQueries(output_items)
    .map((line_segments) => formatRichStoredQueryLine(line_segments, ansi))
    .join('\n')}\n`;
}

/**
 * @param {ShowOutputView} output_view
 * @param {{ color_mode: CliColorMode, color_enabled: boolean }} render_options
 * @param {Ansis} ansi
 * @returns {Promise<string>}
 */
async function renderRichShowOutput(output_view, render_options, ansi) {
  const rendered_source = trimTrailingLineBreaks(
    await renderRichSource(output_view, render_options),
  );

  if (output_view.items.length === 0) {
    return `${rendered_source}\n`;
  }

  return `${rendered_source}\n\n${ansi.gray(FULL_WIDTH_DIVIDER)}\n\n${output_view.items.map((item) => formatRichResolvedLinkItem(item, ansi)).join('\n\n')}\n`;
}

/**
 * @param {OutputNodeItem} output_item
 * @param {Ansis} ansi
 * @returns {string}
 */
function formatRichNodeItem(output_item, ansi) {
  const metadata_row = formatRichMetadataRow(output_item);
  /** @type {string[]} */
  const lines = [ansi.green(formatNodeHeader(output_item))];

  if (metadata_row.length > 0) {
    lines.push(metadata_row);
  }

  lines.push('', `    ${output_item.title}`);

  return lines.join('\n');
}

/**
 * @param {{ kind: 'field_name' | 'keyword' | 'literal' | 'name' | 'operator' | 'plain', text: string }[]} line_segments
 * @param {Ansis} ansi
 * @returns {string}
 */
function formatRichStoredQueryLine(line_segments, ansi) {
  return line_segments
    .map((line_segment) => styleStoredQuerySegment(line_segment, ansi))
    .join('');
}

/**
 * @param {OutputResolvedLinkItem} output_item
 * @param {Ansis} ansi
 * @returns {string}
 */
function formatRichResolvedLinkItem(output_item, ansi) {
  const metadata_row = formatRichResolvedLinkMetadataRow(output_item.target);
  /** @type {string[]} */
  const lines = [
    `${ansi.gray(`[${output_item.reference}]`)} ${ansi.green(`document ${output_item.target.path}`)}`,
  ];

  if (metadata_row.length > 0) {
    lines.push(`    ${metadata_row}`);
  }

  lines.push('', `    ${output_item.target.title}`);

  return lines.join('\n');
}

/**
 * @param {OutputNodeItem} output_item
 * @returns {string}
 */
function formatRichMetadataRow(output_item) {
  /** @type {string[]} */
  const metadata_fields = [];

  if (isDocumentNode(output_item)) {
    metadata_fields.push(`kind: ${output_item.node_kind}`);
  } else {
    metadata_fields.push(`path: ${output_item.path}`);
  }

  if (output_item.status) {
    metadata_fields.push(`status: ${output_item.status}`);
  }

  return metadata_fields.join('  ');
}

/**
 * @param {{ kind?: string, status?: string }} target
 * @returns {string}
 */
function formatRichResolvedLinkMetadataRow(target) {
  /** @type {string[]} */
  const metadata_fields = [];

  if (target.kind) {
    metadata_fields.push(`kind: ${target.kind}`);
  }

  if (target.status) {
    metadata_fields.push(`status: ${target.status}`);
  }

  return metadata_fields.join('  ');
}

/**
 * @param {boolean} color_enabled
 * @returns {Ansis}
 */
function createAnsi(color_enabled) {
  return new Ansis(color_enabled ? 3 : 0);
}

/**
 * @param {{ kind: 'field_name' | 'keyword' | 'literal' | 'name' | 'operator' | 'plain', text: string }} line_segment
 * @param {Ansis} ansi
 * @returns {string}
 */
function styleStoredQuerySegment(line_segment, ansi) {
  if (line_segment.kind === 'name') {
    return ansi.green(line_segment.text);
  }

  if (line_segment.kind === 'operator') {
    return ansi.gray(line_segment.text);
  }

  if (line_segment.kind === 'keyword') {
    return ansi.yellow(line_segment.text);
  }

  return line_segment.text;
}

/**
 * @param {OutputNodeItem} output_item
 * @returns {string}
 */
function formatNodeHeader(output_item) {
  if (isDocumentNode(output_item)) {
    return `document ${output_item.path}`;
  }

  return `${output_item.node_kind} ${output_item.id}`;
}

/**
 * @param {OutputNodeItem} output_item
 * @returns {boolean}
 */
function isDocumentNode(output_item) {
  return output_item.id === `doc:${output_item.path}`;
}

/**
 * @param {string} value
 * @returns {string}
 */
function trimTrailingLineBreaks(value) {
  return value.replace(/\n+$/du, '');
}

/**
 * @param {{ count: number, limit: number, offset: number, total_count: number }} summary
 * @returns {string}
 */
function formatQuerySummary(summary) {
  if (!shouldRenderQuerySummary(summary)) {
    return '';
  }

  return `Showing ${summary.count} of ${summary.total_count} matches.`;
}

/**
 * @param {{ count: number, limit: number, offset: number, total_count: number }} summary
 * @param {string[]} hints
 * @param {Ansis} ansi
 * @returns {string}
 */
function renderRichQueryFooter(summary, hints, ansi) {
  const summary_line = formatQuerySummary(summary);
  /** @type {string[]} */
  const footer_lines = [];

  if (summary_line.length > 0) {
    footer_lines.push(summary_line);
  }

  footer_lines.push(...hints.map((hint) => ansi.gray(hint)));

  return footer_lines.join('\n');
}

/**
 * @param {{ limit: number, offset: number, total_count: number }} summary
 * @returns {boolean}
 */
function shouldRenderQuerySummary(summary) {
  return summary.offset > 0 || summary.total_count > summary.limit;
}
