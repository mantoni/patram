/**
 * @import { OutputNodeItem } from './output-view.types.ts';
 */

import { formatOutputNodeMetadataRows } from './format-output-metadata.js';
import { formatNodeHeader } from './format-node-header.js';
import { formatOutputItemBlock } from './format-output-item-block.js';

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
    if (item_index > 0) {
      output_lines.push('');
    }

    output_lines.push(
      ...indentIncomingNodeBlock(format_node_block(output_item)),
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
  return formatOutputItemBlock({
    header: format_node_header(output_item),
    metadata_rows: formatOutputNodeMetadataRows(output_item),
    title: output_item.title,
  });
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
 * @returns {string[]}
 */
function indentIncomingNodeBlock(block) {
  return block.split('\n').map((line) => (line.length > 0 ? `  ${line}` : ''));
}
