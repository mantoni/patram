/**
 * @import { OutputNodeItem, OutputResolvedLinkItem, OutputStoredQueryItem, OutputView } from './output-view.types.ts';
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
        summary: {
          shown_count: output_view.summary.count,
          total_count: output_view.summary.total_count,
          offset: output_view.summary.offset,
          limit: output_view.summary.limit,
        },
        hints: output_view.hints,
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

  if (output_view.command === 'show') {
    return `${JSON.stringify(
      {
        document: output_view.document
          ? formatJsonShowDocument(output_view.document)
          : undefined,
        source: output_view.source,
        resolved_links: output_view.items.map(formatJsonResolvedLink),
      },
      null,
      2,
    )}\n`;
  }

  throw new Error('Unsupported output view command.');
}

/**
 * @param {OutputNodeItem} output_item
 * @returns {{ derived?: Record<string, boolean | number | string | null>, derived_summary?: string, id: string, kind: string, title: string, path: string, status?: string }}
 */
function formatJsonQueryItem(output_item) {
  /** @type {{ derived?: Record<string, boolean | number | string | null>, derived_summary?: string, id: string, kind: string, title: string, path: string, status?: string }} */
  const query_item = {
    id: output_item.id,
    kind: output_item.node_kind,
    title: output_item.title,
    path: output_item.path,
  };

  if (output_item.status) {
    query_item.status = output_item.status;
  }

  if (output_item.derived_summary) {
    query_item.derived_summary = output_item.derived_summary.name;
    query_item.derived = Object.fromEntries(
      output_item.derived_summary.fields.map((field) => [
        field.name,
        field.value,
      ]),
    );
  }

  return query_item;
}

/**
 * @param {OutputStoredQueryItem} output_item
 * @returns {{ name: string, where: string }}
 */
function formatJsonStoredQuery(output_item) {
  return {
    name: output_item.name,
    where: output_item.where,
  };
}

/**
 * @param {OutputResolvedLinkItem} output_item
 * @returns {{ label: string, reference: number, target: { derived?: Record<string, boolean | number | string | null>, derived_summary?: string, kind?: string, path: string, status?: string, title: string } }}
 */
function formatJsonResolvedLink(output_item) {
  /** @type {{ label: string, reference: number, target: { derived?: Record<string, boolean | number | string | null>, derived_summary?: string, kind?: string, path: string, status?: string, title: string } }} */
  const resolved_link = {
    reference: output_item.reference,
    label: output_item.label,
    target: {
      title: output_item.target.title,
      path: output_item.target.path,
    },
  };

  if (output_item.target.kind) {
    resolved_link.target.kind = output_item.target.kind;
  }

  if (output_item.target.status) {
    resolved_link.target.status = output_item.target.status;
  }

  if (output_item.target.derived_summary) {
    resolved_link.target.derived_summary =
      output_item.target.derived_summary.name;
    resolved_link.target.derived = Object.fromEntries(
      output_item.target.derived_summary.fields.map((field) => [
        field.name,
        field.value,
      ]),
    );
  }

  return resolved_link;
}

/**
 * @param {OutputNodeItem} output_item
 * @returns {{ derived?: Record<string, boolean | number | string | null>, derived_summary?: string, kind: string, title: string, path: string, status?: string }}
 */
function formatJsonShowDocument(output_item) {
  /** @type {{ derived?: Record<string, boolean | number | string | null>, derived_summary?: string, kind: string, title: string, path: string, status?: string }} */
  const document_summary = {
    kind: output_item.node_kind,
    path: output_item.path,
    title: output_item.title,
  };

  if (output_item.status) {
    document_summary.status = output_item.status;
  }

  if (output_item.derived_summary) {
    document_summary.derived_summary = output_item.derived_summary.name;
    document_summary.derived = Object.fromEntries(
      output_item.derived_summary.fields.map((field) => [
        field.name,
        field.value,
      ]),
    );
  }

  return document_summary;
}
