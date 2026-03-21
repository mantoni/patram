/**
 * @import { OutputNodeItem, OutputResolvedLinkItem, OutputStoredQueryItem, OutputView, QueryOutputView, ShowOutputView } from './output-view.types.ts';
 */

import { layoutStoredQueries } from './layout-stored-queries.js';

/**
 * Render the canonical plain output for one output view.
 *
 * @param {OutputView} output_view
 * @returns {string}
 */
export function renderPlainOutput(output_view) {
  if (output_view.command === 'query') {
    return renderPlainQueryOutput(output_view);
  }

  if (output_view.command === 'queries') {
    return renderPlainStoredQueries(output_view.items);
  }

  if (output_view.command === 'show') {
    return renderPlainShowOutput(output_view);
  }

  throw new Error('Unsupported output view command.');
}

/**
 * @param {QueryOutputView} output_view
 * @returns {string}
 */
function renderPlainQueryOutput(output_view) {
  if (output_view.items.length === 0) {
    return renderPlainEmptyQuery(output_view.hints);
  }

  return `${output_view.items.map(formatPlainNodeItem).join('\n\n')}\n`;
}

/**
 * @param {string[]} hints
 * @returns {string}
 */
function renderPlainEmptyQuery(hints) {
  if (hints.length === 0) {
    return 'No matches.\n';
  }

  return `No matches.\n${hints.join('\n')}\n`;
}

/**
 * @param {OutputStoredQueryItem[]} output_items
 * @returns {string}
 */
function renderPlainStoredQueries(output_items) {
  if (output_items.length === 0) {
    return '';
  }

  return `${layoutStoredQueries(output_items)
    .map(formatPlainStoredQueryLine)
    .join('\n')}\n`;
}

/**
 * @param {ShowOutputView} output_view
 * @returns {string}
 */
function renderPlainShowOutput(output_view) {
  const rendered_source = trimTrailingLineBreaks(output_view.rendered_source);

  if (output_view.items.length === 0) {
    return `${rendered_source}\n`;
  }

  return `${rendered_source}\n\n----------------\n${output_view.items.map(formatPlainResolvedLinkItem).join('\n\n')}\n`;
}

/**
 * @param {OutputNodeItem} output_item
 * @returns {string}
 */
function formatPlainNodeItem(output_item) {
  const metadata_row = formatMetadataRow(output_item);
  /** @type {string[]} */
  const lines = [`document ${output_item.path}`];

  if (metadata_row.length > 0) {
    lines.push(metadata_row);
  }

  lines.push('', `    ${output_item.title}`);

  return lines.join('\n');
}

/**
 * @param {{ text: string }[]} line_segments
 * @returns {string}
 */
function formatPlainStoredQueryLine(line_segments) {
  return line_segments.map((segment) => segment.text).join('');
}

/**
 * @param {OutputResolvedLinkItem} output_item
 * @returns {string}
 */
function formatPlainResolvedLinkItem(output_item) {
  const metadata_row = formatResolvedLinkMetadataRow(output_item.target);
  /** @type {string[]} */
  const lines = [
    `[${output_item.reference}] document ${output_item.target.path}`,
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
function formatMetadataRow(output_item) {
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
function formatResolvedLinkMetadataRow(target) {
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
 * @param {string} value
 * @returns {string}
 */
function trimTrailingLineBreaks(value) {
  return value.replace(/\n+$/du, '');
}
