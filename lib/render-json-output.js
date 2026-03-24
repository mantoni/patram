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
 * @returns {{ '$class': string, '$id': string, '$path'?: string, derived?: Record<string, boolean | number | string | null>, derived_summary?: string, fields: Record<string, string | string[]>, title: string }}
 */
function formatJsonQueryItem(output_item) {
  /** @type {{ '$class': string, '$id': string, '$path'?: string, derived?: Record<string, boolean | number | string | null>, derived_summary?: string, fields: Record<string, string | string[]>, title: string }} */
  const query_item = {
    $class: output_item.node_kind,
    $id: output_item.id,
    fields: output_item.fields,
    title: output_item.title,
  };

  if (output_item.path) {
    query_item.$path = output_item.path;
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
 * @returns {{ label: string, reference: number, target: { '$class': string, '$id': string, '$path'?: string, derived?: Record<string, boolean | number | string | null>, derived_summary?: string, fields: Record<string, string | string[]>, title: string } }}
 */
function formatJsonResolvedLink(output_item) {
  /** @type {{ label: string, reference: number, target: { '$class': string, '$id': string, '$path'?: string, derived?: Record<string, boolean | number | string | null>, derived_summary?: string, fields: Record<string, string | string[]>, title: string } }} */
  const resolved_link = {
    reference: output_item.reference,
    label: output_item.label,
    target: {
      $class: output_item.target.kind,
      $id: output_item.target.id,
      fields: output_item.target.fields,
      title: output_item.target.title,
    },
  };

  if (output_item.target.path) {
    resolved_link.target.$path = output_item.target.path;
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
 * @returns {{ '$class': string, '$id': string, '$path'?: string, derived?: Record<string, boolean | number | string | null>, derived_summary?: string, fields: Record<string, string | string[]>, title: string }}
 */
function formatJsonShowDocument(output_item) {
  /** @type {{ '$class': string, '$id': string, '$path'?: string, derived?: Record<string, boolean | number | string | null>, derived_summary?: string, fields: Record<string, string | string[]>, title: string }} */
  const document_summary = {
    $class: output_item.node_kind,
    $id: output_item.id,
    fields: output_item.fields,
    title: output_item.title,
  };

  if (output_item.path) {
    document_summary.$path = output_item.path;
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
