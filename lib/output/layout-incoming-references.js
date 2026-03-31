/**
 * @import { RefsOutputView, OutputNodeItem } from './output-view.types.ts';
 */

import { formatCompactMetadataLabel } from './compact-layout.js';
import { formatNodeHeader } from './format-node-header.js';
import {
  formatOutputNodeStoredMetadataRow,
  formatOutputNodeSummaryRow,
} from './format-output-metadata.js';

const INCOMING_TREE_PREFIX_WIDTH = 5;

/**
 * Layout grouped incoming references as plain text lines.
 *
 * @param {Record<string, OutputNodeItem[]>} incoming
 * @param {{
 *   format_node_block?: (output_item: OutputNodeItem) => string,
 *   format_node_header?: (output_item: OutputNodeItem) => string,
 *   format_relation_header?: (relation_name: string, relation_count: number) => string,
 * }} layout_options
 * @returns {string[]}
 */
export function layoutIncomingReferenceLines(incoming, layout_options = {}) {
  const formatNodeBlock = layout_options.format_node_block;
  const formatNodeHeader =
    layout_options.format_node_header ?? defaultNodeHeaderFormatter;
  const formatRelationHeader =
    layout_options.format_relation_header ?? defaultRelationHeaderFormatter;
  /** @type {string[]} */
  const output_lines = [];

  for (const relation_name of Object.keys(incoming)) {
    if (output_lines.length > 0) {
      output_lines.push('');
    }

    const relation_sources = incoming[relation_name];

    output_lines.push(
      formatRelationHeader(relation_name, relation_sources.length),
    );
    output_lines.push(
      ...layoutIncomingRelationSources(
        relation_sources,
        formatNodeBlock ?? createDefaultNodeBlockFormatter(formatNodeHeader),
      ),
    );
  }

  return output_lines;
}

/**
 * @param {RefsOutputView} output_view
 * @returns {string[]}
 */
export function collectIncomingRefHeaders(output_view) {
  /** @type {string[]} */
  const headers = [formatNodeHeader(output_view.node)];

  for (const incoming_items of Object.values(output_view.incoming)) {
    for (const output_item of incoming_items) {
      headers.push(formatNodeHeader(output_item));
    }
  }

  return headers;
}

/**
 * @param {{ is_tty?: boolean, terminal_width?: number }} render_options
 * @returns {{ is_tty?: boolean, terminal_width?: number }}
 */
export function createIncomingTreeRenderOptions(render_options) {
  if (typeof render_options.terminal_width !== 'number') {
    return render_options;
  }

  return {
    ...render_options,
    terminal_width: Math.max(
      1,
      render_options.terminal_width - INCOMING_TREE_PREFIX_WIDTH,
    ),
  };
}

/**
 * @param {OutputNodeItem} output_item
 * @returns {string}
 */
function defaultNodeHeaderFormatter(output_item) {
  return formatNodeHeader(output_item);
}

/**
 * @param {string} relation_name
 * @param {number} relation_count
 * @returns {string}
 */
function defaultRelationHeaderFormatter(relation_name, relation_count) {
  return `${relation_name} (${relation_count})`;
}

/**
 * @param {OutputNodeItem[]} relation_sources
 * @param {(output_item: OutputNodeItem) => string} format_node_block
 * @returns {string[]}
 */
function layoutIncomingRelationSources(relation_sources, format_node_block) {
  /** @type {string[]} */
  const output_lines = [];

  for (const [item_index, output_item] of relation_sources.entries()) {
    output_lines.push(
      ...layoutIncomingNodeBlock(
        format_node_block(output_item),
        item_index === relation_sources.length - 1,
      ),
    );
  }

  return output_lines;
}

/**
 * @param {OutputNodeItem} output_item
 * @param {(output_item: OutputNodeItem) => string} format_node_header
 * @returns {string}
 */
function formatIncomingNodeBlock(output_item, format_node_header) {
  const stored_metadata_row = formatOutputNodeStoredMetadataRow(output_item);
  const summary_row = formatOutputNodeSummaryRow(output_item);
  const metadata_label = stored_metadata_row
    ? formatCompactMetadataLabel([stored_metadata_row])
    : undefined;
  const header = metadata_label
    ? `${format_node_header(output_item)}  ${metadata_label}`
    : format_node_header(output_item);
  /** @type {string[]} */
  const output_lines = [header];

  if (summary_row) {
    output_lines.push(summary_row);
  }

  output_lines.push(output_item.title);

  if (output_item.description) {
    output_lines.push(...output_item.description.split('\n'));
  }

  return output_lines.join('\n');
}

/**
 * @param {(output_item: OutputNodeItem) => string} format_node_header
 * @returns {(output_item: OutputNodeItem) => string}
 */
function createDefaultNodeBlockFormatter(format_node_header) {
  return (output_item) =>
    formatIncomingNodeBlock(output_item, format_node_header);
}

/**
 * @param {string} block
 * @param {boolean} is_last_item
 * @returns {string[]}
 */
function layoutIncomingNodeBlock(block, is_last_item) {
  const header_prefix = is_last_item ? '  └─ ' : '  ├─ ';
  const continuation_prefix = is_last_item ? '       ' : '  │    ';

  return block.split('\n').map((line, line_index) => {
    if (line_index === 0) {
      return `${header_prefix}${line}`;
    }

    if (line.length === 0) {
      return '';
    }

    return `${continuation_prefix}${trimIncomingContinuationIndent(line)}`;
  });
}

/**
 * @param {string} line
 * @returns {string}
 */
function trimIncomingContinuationIndent(line) {
  return line.startsWith('  ') ? line.slice(2) : line;
}
