/**
 * @import { OutputNodeItem, OutputResolvedLinkItem, OutputStoredQueryItem, OutputView, QueryOutputView, ShowOutputView } from './output-view.types.ts';
 */

import {
  formatOutputNodeMetadataRows,
  formatResolvedLinkMetadataRows,
} from './format-output-metadata.js';
import { formatNodeHeader } from './format-node-header.js';
import { formatOutputItemBlock } from './format-output-item-block.js';
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
  const footer = renderPlainQueryFooter(output_view.summary, output_view.hints);

  if (output_view.items.length === 0) {
    return renderPlainEmptyQuery(footer);
  }

  if (footer.length === 0) {
    return `${output_view.items.map(formatPlainNodeItem).join('\n\n')}\n`;
  }

  return `${output_view.items.map(formatPlainNodeItem).join('\n\n')}\n\n${footer}\n`;
}

/**
 * @param {string} footer
 * @returns {string}
 */
function renderPlainEmptyQuery(footer) {
  if (footer.length === 0) {
    return 'No matches.\n';
  }

  return `No matches.\n${footer}\n`;
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
  const document_summary = output_view.document
    ? formatPlainNodeItem(output_view.document)
    : '';

  if (document_summary.length === 0 && output_view.items.length === 0) {
    return `${rendered_source}\n`;
  }

  /** @type {string[]} */
  const summary_items = [];

  if (document_summary.length > 0) {
    summary_items.push(document_summary);
  }

  summary_items.push(...output_view.items.map(formatPlainResolvedLinkItem));

  return `${rendered_source}\n\n----------------\n${summary_items.join('\n\n')}\n`;
}

/**
 * @param {OutputNodeItem} output_item
 * @returns {string}
 */
function formatPlainNodeItem(output_item) {
  return formatOutputItemBlock({
    header: formatNodeHeader(output_item),
    metadata_rows: formatOutputNodeMetadataRows(output_item),
    title: output_item.title,
  });
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
  return formatOutputItemBlock({
    header: `[${output_item.reference}] ${output_item.target.kind} ${output_item.target.path ?? output_item.target.id}`,
    metadata_rows: formatResolvedLinkMetadataRows(output_item.target),
    metadata_indent: '    ',
    title: output_item.target.title,
  });
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
 * @returns {string}
 */
function renderPlainQueryFooter(summary, hints) {
  const summary_line = formatQuerySummary(summary);
  const footer_lines = [];

  if (summary_line.length > 0) {
    footer_lines.push(summary_line);
  }

  footer_lines.push(...hints);

  return footer_lines.join('\n');
}

/**
 * @param {{ limit: number, offset: number, total_count: number }} summary
 * @returns {boolean}
 */
function shouldRenderQuerySummary(summary) {
  return summary.offset > 0 || summary.total_count > summary.limit;
}
