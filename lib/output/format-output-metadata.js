import { formatDerivedSummaryRow } from './format-derived-summary-row.js';

/**
 * @param {import('./output-view.types.ts').OutputNodeItem} output_item
 * @returns {string[]}
 */
export function formatOutputNodeMetadataRows(output_item) {
  /** @type {string[]} */
  const metadata_rows = [];
  const stored_metadata_fields =
    output_item.visible_fields.map(formatMetadataField);

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
  const stored_metadata_fields = target.visible_fields.map(formatMetadataField);

  if (stored_metadata_fields.length > 0) {
    metadata_rows.push(stored_metadata_fields.join('  '));
  }

  if (target.derived_summary) {
    metadata_rows.push(formatDerivedSummaryRow(target.derived_summary));
  }

  return metadata_rows;
}

/**
 * @param {import('./output-view.types.ts').OutputMetadataField} output_field
 * @returns {string}
 */
function formatMetadataField(output_field) {
  const value = Array.isArray(output_field.value)
    ? output_field.value.join(', ')
    : output_field.value;

  return `${output_field.name}: ${value}`;
}
