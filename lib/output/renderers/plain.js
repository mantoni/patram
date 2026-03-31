/* eslint-disable max-lines */
/**
 * @import { OutputNodeItem, OutputResolvedLinkItem, OutputStoredQueryItem, OutputView, QueryOutputView, RefsOutputView, ShowOutputView } from '../output-view.types.ts';
 */

import {
  formatOutputNodeStoredMetadataRow,
  formatOutputNodeSummaryRow,
  formatResolvedLinkStoredMetadataRow,
  formatResolvedLinkSummaryRow,
} from '../format-output-metadata.js';
import {
  formatCompactMetadataLabel,
  formatCompactTitleRow,
  getCompactLeftTitleWidth,
  wrapCompactBodyText,
} from '../compact-layout.js';
import { formatNodeHeader } from '../format-node-header.js';
import { formatStoredQueryBlock } from '../format-stored-query-block.js';
import { layoutIncomingReferenceLines } from '../layout-incoming-references.js';
import { layoutIncomingSummaryLines } from '../layout-incoming-summary-lines.js';
import {
  formatResolvedLinkBodyLines,
  formatResolvedLinkHeader,
} from '../resolved-link-layout.js';

/**
 * Render the canonical plain output for one output view.
 *
 * @param {OutputView} output_view
 * @param {{ is_tty?: boolean, terminal_width?: number }=} render_options
 * @returns {string}
 */
export function renderPlainOutput(output_view, render_options = {}) {
  if (output_view.command === 'query') {
    return renderPlainQueryOutput(output_view, render_options);
  }

  if (output_view.command === 'queries') {
    return renderPlainStoredQueries(output_view, render_options);
  }

  if (output_view.command === 'refs') {
    return renderPlainRefsOutput(output_view, render_options);
  }

  if (output_view.command === 'show') {
    return renderPlainShowOutput(output_view, render_options);
  }

  throw new Error('Unsupported output view command.');
}

/**
 * @param {QueryOutputView} output_view
 * @param {{ is_tty?: boolean, terminal_width?: number }} render_options
 * @returns {string}
 */
function renderPlainQueryOutput(output_view, render_options) {
  const footer = renderPlainQueryFooter(output_view.summary, output_view.hints);

  if (output_view.items.length === 0) {
    return renderPlainEmptyQuery(footer);
  }

  const left_title_width = getCompactLeftTitleWidth(
    output_view.items.map((output_item) => formatNodeHeader(output_item)),
  );
  const output_blocks = output_view.items.map((output_item) =>
    formatPlainNodeItem(output_item, {
      ...render_options,
      left_title_width,
    }),
  );

  if (footer.length === 0) {
    return `${output_blocks.join('\n\n')}\n`;
  }

  return `${output_blocks.join('\n\n')}\n\n${footer}\n`;
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
 * @param {Extract<OutputView, { command: 'queries' }>} output_view
 * @param {{ is_tty?: boolean, terminal_width?: number }} render_options
 * @returns {string}
 */
function renderPlainStoredQueries(output_view, render_options) {
  if (output_view.items.length === 0) {
    return '';
  }

  const output_blocks = output_view.items.map((output_item) =>
    formatPlainStoredQueryBlock(output_item, render_options),
  );

  if (output_view.hints.length === 0) {
    return `${output_blocks.join('\n')}\n`;
  }

  return `${output_blocks.join('\n')}\n${output_view.hints.join('\n')}\n`;
}

/**
 * @param {ShowOutputView} output_view
 * @param {{ is_tty?: boolean, terminal_width?: number }} render_options
 * @returns {string}
 */
function renderPlainShowOutput(output_view, render_options) {
  const rendered_source = trimTrailingLineBreaks(output_view.rendered_source);
  const incoming_summary = renderPlainIncomingSummary(output_view);

  if (output_view.items.length === 0 && incoming_summary.length === 0) {
    return `${rendered_source}\n`;
  }
  const left_title_width = getCompactLeftTitleWidth(
    output_view.items.map(formatResolvedLinkHeader),
  );
  const summary_blocks = output_view.items.map((output_item) =>
    formatPlainResolvedLinkItem(output_item, {
      ...render_options,
      left_title_width,
    }),
  );

  if (incoming_summary.length > 0) {
    summary_blocks.push(incoming_summary);
  }

  return `${rendered_source}\n\n----------------\n${summary_blocks.join('\n\n')}\n`;
}

/**
 * @param {RefsOutputView} output_view
 * @param {{ is_tty?: boolean, terminal_width?: number }} render_options
 * @returns {string}
 */
function renderPlainRefsOutput(output_view, render_options) {
  const left_title_width = getCompactLeftTitleWidth(
    collectIncomingRefHeaders(output_view),
  );
  const node_summary = formatPlainNodeItem(output_view.node, {
    ...render_options,
    left_title_width,
  });
  const output_lines = layoutIncomingReferenceLines(output_view.incoming, {
    format_node_block(output_item) {
      return formatPlainNodeItem(output_item, {
        ...render_options,
        left_title_width,
      });
    },
  });

  if (output_lines.length === 0) {
    return `${node_summary}\n\nNo incoming references.\n`;
  }

  return `${node_summary}\n\n${output_lines.join('\n')}\n`;
}

/**
 * @param {OutputNodeItem} output_item
 * @param {{ is_tty?: boolean, left_title_width: number, terminal_width?: number }} render_options
 * @returns {string}
 */
function formatPlainNodeItem(output_item, render_options) {
  const metadata_label = formatStoredMetadataLabel(
    formatOutputNodeStoredMetadataRow(output_item),
  );
  const summary_row = formatOutputNodeSummaryRow(output_item);
  /** @type {string[]} */
  const output_lines = [
    formatCompactTitleRow({
      is_tty: render_options.is_tty,
      left_title: formatNodeHeader(output_item),
      left_title_width: render_options.left_title_width,
      right_title: metadata_label,
      terminal_width: render_options.terminal_width,
    }),
  ];

  if (summary_row) {
    output_lines.push(`  ${summary_row}`);
  }

  output_lines.push(`  ${output_item.title}`);

  if (output_item.description) {
    for (const description_line of wrapCompactBodyText(
      output_item.description,
      render_options,
    )) {
      output_lines.push(
        description_line.length > 0 ? `  ${description_line}` : '',
      );
    }
  }

  return output_lines.join('\n');
}

/**
 * @param {OutputStoredQueryItem} output_item
 * @param {{ is_tty?: boolean, terminal_width?: number }} render_options
 * @returns {string}
 */
function formatPlainStoredQueryBlock(output_item, render_options) {
  return formatStoredQueryBlock(output_item, render_options, {
    format_line: formatPlainStoredQueryLine,
    format_name(text) {
      return text;
    },
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
 * @param {{ is_tty?: boolean, left_title_width: number, terminal_width?: number }} render_options
 * @returns {string}
 */
function formatPlainResolvedLinkItem(output_item, render_options) {
  const metadata_label = formatStoredMetadataLabel(
    formatResolvedLinkStoredMetadataRow(output_item.target),
  );
  const summary_row = formatResolvedLinkSummaryRow(output_item.target);
  /** @type {string[]} */
  const output_lines = [
    formatCompactTitleRow({
      is_tty: render_options.is_tty,
      left_title: formatResolvedLinkHeader(output_item),
      left_title_width: render_options.left_title_width,
      right_title: metadata_label,
      terminal_width: render_options.terminal_width,
    }),
  ];

  if (summary_row) {
    output_lines.push(`    ${summary_row}`);
  }

  output_lines.push(
    ...formatResolvedLinkBodyLines(output_item, {
      body_indent: '    ',
      is_tty: render_options.is_tty,
      terminal_width: render_options.terminal_width,
    }),
  );

  return output_lines.join('\n');
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
 * @param {string | undefined} metadata_row
 * @returns {string | undefined}
 */
function formatStoredMetadataLabel(metadata_row) {
  if (!metadata_row) {
    return undefined;
  }

  return formatCompactMetadataLabel([metadata_row]);
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

/**
 * @param {RefsOutputView} output_view
 * @returns {string[]}
 */
function collectIncomingRefHeaders(output_view) {
  /** @type {string[]} */
  const headers = [formatNodeHeader(output_view.node)];

  for (const incoming_items of Object.values(output_view.incoming)) {
    for (const output_item of incoming_items) {
      headers.push(formatNodeHeader(output_item));
    }
  }

  return headers;
}
