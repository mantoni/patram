import { formatDerivedSummaryRow } from './format-derived-summary-row.js';
import { isDocumentNode } from './format-node-header.js';

/**
 * @param {import('./output-view.types.ts').OutputNodeItem} output_item
 * @returns {string[]}
 */
export function formatOutputNodeMetadataRows(output_item) {
  /** @type {string[]} */
  const metadata_rows = [];
  /** @type {string[]} */
  const stored_metadata_fields = [];

  if (isDocumentNode(output_item)) {
    stored_metadata_fields.push(`kind: ${output_item.node_kind}`);
  } else {
    stored_metadata_fields.push(`path: ${output_item.path}`);
  }

  if (output_item.status) {
    stored_metadata_fields.push(`status: ${output_item.status}`);
  }

  if (stored_metadata_fields.length > 0) {
    metadata_rows.push(stored_metadata_fields.join('  '));
  }

  if (output_item.derived_summary) {
    metadata_rows.push(formatDerivedSummaryRow(output_item.derived_summary));
  }

  return metadata_rows;
}

/**
 * @param {import('./output-view.types.ts').OutputResolvedLinkTarget} target
 * @returns {string[]}
 */
export function formatResolvedLinkMetadataRows(target) {
  /** @type {string[]} */
  const metadata_rows = [];
  /** @type {string[]} */
  const stored_metadata_fields = [];

  if (target.kind) {
    stored_metadata_fields.push(`kind: ${target.kind}`);
  }

  if (target.status) {
    stored_metadata_fields.push(`status: ${target.status}`);
  }

  if (stored_metadata_fields.length > 0) {
    metadata_rows.push(stored_metadata_fields.join('  '));
  }

  if (target.derived_summary) {
    metadata_rows.push(formatDerivedSummaryRow(target.derived_summary));
  }

  return metadata_rows;
}
