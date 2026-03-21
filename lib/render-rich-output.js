/**
 * @import { CliColorMode } from './parse-cli-arguments.types.ts';
 * @import { OutputNodeItem, OutputResolvedLinkItem, OutputStoredQueryItem, OutputView, QueryOutputView, ShowOutputView } from './output-view.types.ts';
 */

import { Ansis } from 'ansis';

import { layoutStoredQueries } from './layout-stored-queries.js';

/**
 * Render styled rich output while preserving the plain layout.
 *
 * @param {OutputView} output_view
 * @param {{ color_mode: CliColorMode, color_enabled: boolean }} render_options
 * @returns {string}
 */
export function renderRichOutput(output_view, render_options) {
  const ansi = createAnsi(render_options.color_enabled);

  if (output_view.command === 'query') {
    return renderRichQueryOutput(output_view, ansi);
  }

  if (output_view.command === 'queries') {
    return renderRichStoredQueries(output_view.items, ansi);
  }

  if (output_view.command === 'show') {
    return renderRichShowOutput(output_view, ansi);
  }

  throw new Error('Unsupported output view command.');
}

/**
 * @param {QueryOutputView} output_view
 * @param {Ansis} ansi
 * @returns {string}
 */
function renderRichQueryOutput(output_view, ansi) {
  if (output_view.items.length === 0) {
    return renderRichEmptyQuery(output_view.hints, ansi);
  }

  return `${output_view.items.map((item) => formatRichNodeItem(item, ansi)).join('\n\n')}\n`;
}

/**
 * @param {string[]} hints
 * @param {Ansis} ansi
 * @returns {string}
 */
function renderRichEmptyQuery(hints, ansi) {
  if (hints.length === 0) {
    return `${ansi.yellow('No matches.')}\n`;
  }

  return `${ansi.yellow('No matches.')}\n${hints.map((hint) => ansi.gray(hint)).join('\n')}\n`;
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
 * @param {Ansis} ansi
 * @returns {string}
 */
function renderRichShowOutput(output_view, ansi) {
  const rendered_source = trimTrailingLineBreaks(output_view.rendered_source);

  if (output_view.items.length === 0) {
    return `${rendered_source}\n`;
  }

  return `${rendered_source}\n\n${ansi.gray('----------------')}\n${output_view.items.map((item) => formatRichResolvedLinkItem(item, ansi)).join('\n\n')}\n`;
}

/**
 * @param {OutputNodeItem} output_item
 * @param {Ansis} ansi
 * @returns {string}
 */
function formatRichNodeItem(output_item, ansi) {
  const metadata_row = formatRichMetadataRow(output_item);
  /** @type {string[]} */
  const lines = [ansi.green(`document ${output_item.path}`)];

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

  metadata_fields.push(`kind: ${output_item.node_kind}`);

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
 * @param {string} value
 * @returns {string}
 */
function trimTrailingLineBreaks(value) {
  return value.replace(/\n+$/du, '');
}
