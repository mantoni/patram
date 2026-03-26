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
 * @param {{ format_node_header?: (output_item: OutputNodeItem) => string }=} layout_options
 * @returns {string[]}
 */
export function layoutIncomingReferenceLines(incoming, layout_options = {}) {
  const format_node_header =
    layout_options.format_node_header ?? defaultNodeHeaderFormatter;
  /** @type {string[]} */
  const output_lines = [];

  for (const relation_name of Object.keys(incoming)) {
    if (output_lines.length > 0) {
      output_lines.push('');
    }

    const relation_sources = incoming[relation_name];

    output_lines.push(`${relation_name} (${relation_sources.length})`);
    output_lines.push(
      ...layoutIncomingRelationSources(relation_sources, format_node_header),
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
 * @param {OutputNodeItem[]} relation_sources
 * @param {(output_item: OutputNodeItem) => string} format_node_header
 * @returns {string[]}
 */
function layoutIncomingRelationSources(relation_sources, format_node_header) {
  /** @type {string[]} */
  const output_lines = [];

  for (const [item_index, output_item] of relation_sources.entries()) {
    if (item_index > 0) {
      output_lines.push('');
    }

    output_lines.push(
      ...indentIncomingNodeBlock(
        formatIncomingNodeBlock(output_item, format_node_header),
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
  return formatOutputItemBlock({
    header: format_node_header(output_item),
    metadata_rows: formatOutputNodeMetadataRows(output_item),
    title: output_item.title,
  });
}

/**
 * @param {string} block
 * @returns {string[]}
 */
function indentIncomingNodeBlock(block) {
  return block
    .split('\n')
    .map((line) => (line.length > 0 ? `    ${line}` : ''));
}
