/**
 * @import { OutputNodeItem, OutputStoredQueryItem, OutputView } from './output-view.types.ts';
 */

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

  throw new Error(`Unsupported output view command "${output_view.command}".`);
}

/**
 * @param {OutputView} output_view
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
 * @param {import('./output-view.types.ts').OutputView['items']} output_items
 * @returns {string}
 */
function renderPlainStoredQueries(output_items) {
  if (output_items.length === 0) {
    return '';
  }

  return `${output_items.map(formatPlainStoredQuery).join('\n')}\n`;
}

/**
 * @param {OutputNodeItem | OutputStoredQueryItem} output_item
 * @returns {string}
 */
function formatPlainNodeItem(output_item) {
  if (output_item.kind !== 'node') {
    throw new Error(
      `Expected a node output item, received "${output_item.kind}".`,
    );
  }

  const metadata_row = formatMetadataRow(output_item);

  if (metadata_row.length === 0) {
    return `${output_item.title}\n${output_item.path}`;
  }

  return `${output_item.title}\n${output_item.path}\n${metadata_row}`;
}

/**
 * @param {OutputNodeItem | OutputStoredQueryItem} output_item
 * @returns {string}
 */
function formatPlainStoredQuery(output_item) {
  if (output_item.kind !== 'stored_query') {
    throw new Error(
      `Expected a stored query output item, received "${output_item.kind}".`,
    );
  }

  return `${output_item.name} ${output_item.where}`;
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
