/**
 * @param {import('./output-view.types.ts').OutputNodeItem} output_item
 * @returns {string}
 */
export function formatNodeHeader(output_item) {
  if (isDocumentNode(output_item)) {
    return `document ${output_item.path}`;
  }

  return `${output_item.node_kind} ${output_item.id}`;
}

/**
 * @param {import('./output-view.types.ts').OutputNodeItem} output_item
 * @returns {boolean}
 */
export function isDocumentNode(output_item) {
  return output_item.id === `doc:${output_item.path}`;
}
