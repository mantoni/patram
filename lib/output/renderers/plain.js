/**
 * @import { OutputNodeItem, OutputResolvedLinkItem, OutputStoredQueryItem, OutputView, QueryOutputView, RefsOutputView, ShowOutputView } from '../output-view.types.ts';
 */

import {
  formatOutputNodeMetadataRows,
  formatResolvedLinkMetadataRows,
} from '../format-output-metadata.js';
import { formatNodeHeader } from '../format-node-header.js';
import { formatOutputItemBlock } from '../format-output-item-block.js';
import { layoutIncomingReferenceLines } from '../layout-incoming-references.js';
import { layoutIncomingSummaryLines } from '../layout-incoming-summary-lines.js';
import { layoutStoredQueries } from '../layout-stored-queries.js';

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

  if (output_view.command === 'refs') {
    return renderPlainRefsOutput(output_view);
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
  const incoming_summary = renderPlainIncomingSummary(output_view);

  if (output_view.items.length === 0 && incoming_summary.length === 0) {
    return `${rendered_source}\n`;
  }
  const summary_blocks = output_view.items.map(formatPlainResolvedLinkItem);

  if (incoming_summary.length > 0) {
    summary_blocks.push(incoming_summary);
  }

  return `${rendered_source}\n\n----------------\n${summary_blocks.join('\n\n')}\n`;
}

/**
 * @param {RefsOutputView} output_view
 * @returns {string}
 */
function renderPlainRefsOutput(output_view) {
  const node_summary = formatPlainNodeItem(output_view.node);
  const output_lines = layoutIncomingReferenceLines(output_view.incoming);

  if (output_lines.length === 0) {
    return `${node_summary}\n\nNo incoming references.\n`;
  }

  return `${node_summary}\n\n${output_lines.join('\n')}\n`;
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
 * @param {ShowOutputView} output_view
 * @returns {string}
 */
function renderPlainIncomingSummary(output_view) {
  if (!hasIncomingSummary(output_view.incoming_summary)) {
    return '';
  }

  const output_lines = layoutIncomingSummaryLines(output_view.incoming_summary);
  output_lines.push('', `Hint: patram refs ${output_view.path}`);

  return output_lines.join('\n');
}

/**
 * @param {Record<string, number>} incoming_summary
 * @returns {boolean}
 */
function hasIncomingSummary(incoming_summary) {
  return Object.keys(incoming_summary).length > 0;
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
