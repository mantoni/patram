/**
 * @import { CliColorMode } from '../../cli/arguments.types.ts';
 * @import { OutputNodeItem, OutputResolvedLinkItem, OutputStoredQueryItem, OutputView, QueryOutputView, RefsOutputView, ShowOutputView } from '../output-view.types.ts';
 */

import { Ansis } from 'ansis';

import {
  formatOutputNodeMetadataRows,
  formatResolvedLinkMetadataRows,
} from '../format-output-metadata.js';
import { formatNodeHeader } from '../format-node-header.js';
import { formatOutputItemBlock } from '../format-output-item-block.js';
import { layoutIncomingReferenceLines } from '../layout-incoming-references.js';
import { layoutIncomingSummaryLines } from '../layout-incoming-summary-lines.js';
import { layoutStoredQueries } from '../layout-stored-queries.js';
import { renderRichSource } from '../rich-source/render.js';

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

  if (output_view.command === 'refs') {
    return renderRichRefsOutput(output_view, ansi);
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
  const document_summary = output_view.document
    ? formatRichNodeItem(output_view.document, ansi)
    : '';
  const incoming_summary = renderRichIncomingSummary(output_view, ansi);

  if (
    document_summary.length === 0 &&
    output_view.items.length === 0 &&
    incoming_summary.length === 0
  ) {
    return `${rendered_source}\n`;
  }

  /** @type {string[]} */
  const summary_items = [];

  if (document_summary.length > 0) {
    summary_items.push(document_summary);
  }

  summary_items.push(
    ...output_view.items.map((item) => formatRichResolvedLinkItem(item, ansi)),
  );

  if (incoming_summary.length > 0) {
    summary_items.push(incoming_summary);
  }

  return `${rendered_source}\n\n${ansi.gray(FULL_WIDTH_DIVIDER)}\n\n${summary_items.join('\n\n')}\n`;
}

/**
 * @param {RefsOutputView} output_view
 * @param {Ansis} ansi
 * @returns {string}
 */
function renderRichRefsOutput(output_view, ansi) {
  const node_summary = formatRichNodeItem(output_view.node, ansi);
  const output_lines = layoutIncomingReferenceLines(output_view.incoming, {
    format_node_header(output_item) {
      return ansi.green(formatNodeHeader(output_item));
    },
    format_relation_header(relation_name, relation_count) {
      return `${ansi.bold(relation_name)} ${ansi.gray(`(${relation_count})`)}`;
    },
  });

  return output_lines.length === 0
    ? `${node_summary}\n\n${ansi.yellow('No incoming references.')}\n`
    : `${node_summary}\n\n${output_lines.join('\n')}\n`;
}

/**
 * @param {OutputNodeItem} output_item
 * @param {Ansis} ansi
 * @returns {string}
 */
function formatRichNodeItem(output_item, ansi) {
  return formatOutputItemBlock({
    header: ansi.green(formatNodeHeader(output_item)),
    metadata_rows: formatOutputNodeMetadataRows(output_item),
    title: output_item.title,
  });
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
  return formatOutputItemBlock({
    header: `${ansi.gray(`[${output_item.reference}]`)} ${ansi.green(`${output_item.target.kind} ${output_item.target.path ?? output_item.target.id}`)}`,
    metadata_rows: formatResolvedLinkMetadataRows(output_item.target),
    metadata_indent: '    ',
    title: output_item.target.title,
  });
}

/**
 * @param {ShowOutputView} output_view
 * @param {Ansis} ansi
 * @returns {string}
 */
function renderRichIncomingSummary(output_view, ansi) {
  if (!hasIncomingSummary(output_view.incoming_summary)) {
    return '';
  }

  const output_lines = layoutIncomingSummaryLines(output_view.incoming_summary);
  output_lines[0] = ansi.bold(output_lines[0]);

  output_lines.push('', ansi.gray(`Hint: patram refs ${output_view.path}`));

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
    return ansi.gray(line_segment.text);
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
