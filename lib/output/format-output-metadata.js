import { formatDerivedSummaryRow } from './format-derived-summary-row.js';

/**
 * @param {import('./output-view.types.ts').OutputNodeItem} output_item
 * @returns {string | undefined}
 */
export function formatOutputNodeStoredMetadataRow(output_item) {
  return formatStoredMetadataRow(output_item.visible_fields);
}

/**
 * @param {import('./output-view.types.ts').OutputNodeItem} output_item
 * @returns {string | undefined}
 */
export function formatOutputNodeSummaryRow(output_item) {
  return formatDerivedMetadataRow(output_item.derived_summary);
}

/**
 * @param {import('./output-view.types.ts').OutputResolvedLinkTarget} target
 * @returns {string | undefined}
 */
export function formatResolvedLinkStoredMetadataRow(target) {
  return formatStoredMetadataRow(target.visible_fields);
}

/**
 * @param {import('./output-view.types.ts').OutputResolvedLinkTarget} target
 * @returns {string | undefined}
 */
export function formatResolvedLinkSummaryRow(target) {
  return formatDerivedMetadataRow(target.derived_summary);
}

/**
 * @param {import('./output-view.types.ts').OutputMetadataField[]} visible_fields
 * @returns {string | undefined}
 */
function formatStoredMetadataRow(visible_fields) {
  const stored_metadata_fields = visible_fields.map(formatMetadataField);

  if (stored_metadata_fields.length === 0) {
    return undefined;
  }

  return stored_metadata_fields.join('  ');
}

/**
 * @param {import('./output-view.types.ts').OutputDerivedSummary | undefined} derived_summary
 * @returns {string | undefined}
 */
function formatDerivedMetadataRow(derived_summary) {
  if (!derived_summary) {
    return undefined;
  }

  return `summary: ${formatDerivedSummaryRow(derived_summary)}`;
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
