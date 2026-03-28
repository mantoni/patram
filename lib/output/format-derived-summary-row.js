/**
 * @param {import('./output-view.types.ts').OutputDerivedSummary} derived_summary
 * @returns {string}
 */
export function formatDerivedSummaryRow(derived_summary) {
  return derived_summary.fields
    .map((field) => `${field.name}: ${String(field.value)}`)
    .join('  ');
}
