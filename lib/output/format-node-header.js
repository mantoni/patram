/**
 * @param {import('./output-view.types.ts').OutputNodeItem} output_item
 * @returns {string}
 */
export function formatNodeHeader(output_item) {
  if (output_item.path) {
    return `${output_item.node_kind} ${output_item.path}`;
  }

  return `${output_item.node_kind} ${getOutputNodeKey(output_item.id)}`;
}

/**
 * @param {string} node_id
 * @returns {string}
 */
function getOutputNodeKey(node_id) {
  return node_id.includes(':')
    ? node_id.split(':').slice(1).join(':')
    : node_id;
}
