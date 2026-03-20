/**
 * @import { OutputNodeItem, OutputStoredQueryItem, OutputView } from './output-view.types.ts';
 */

/**
 * Render structured JSON output for one output view.
 *
 * @param {OutputView} output_view
 * @returns {string}
 */
export function renderJsonOutput(output_view) {
  if (output_view.command === 'query') {
    return `${JSON.stringify(
      {
        results: output_view.items.map(formatJsonQueryItem),
      },
      null,
      2,
    )}\n`;
  }

  if (output_view.command === 'queries') {
    return `${JSON.stringify(
      {
        queries: output_view.items.map(formatJsonStoredQuery),
      },
      null,
      2,
    )}\n`;
  }

  throw new Error(`Unsupported output view command "${output_view.command}".`);
}

/**
 * @param {OutputNodeItem | OutputStoredQueryItem} output_item
 * @returns {{ id: string, kind: string, title: string, path: string, status?: string }}
 */
function formatJsonQueryItem(output_item) {
  if (output_item.kind !== 'node') {
    throw new Error(
      `Expected a node output item, received "${output_item.kind}".`,
    );
  }

  /** @type {{ id: string, kind: string, title: string, path: string, status?: string }} */
  const query_item = {
    id: output_item.id,
    kind: output_item.node_kind,
    title: output_item.title,
    path: output_item.path,
  };

  if (output_item.status) {
    query_item.status = output_item.status;
  }

  return query_item;
}

/**
 * @param {OutputNodeItem | OutputStoredQueryItem} output_item
 * @returns {{ name: string, where: string }}
 */
function formatJsonStoredQuery(output_item) {
  if (output_item.kind !== 'stored_query') {
    throw new Error(
      `Expected a stored query output item, received "${output_item.kind}".`,
    );
  }

  return {
    name: output_item.name,
    where: output_item.where,
  };
}
