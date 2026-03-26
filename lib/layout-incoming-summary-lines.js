/**
 * Layout compact incoming-summary lines for `show`.
 *
 * @param {Record<string, number>} incoming_summary
 * @returns {string[]}
 */
export function layoutIncomingSummaryLines(incoming_summary) {
  const relation_names = Object.keys(incoming_summary);
  const output_lines = ['incoming refs:'];

  for (const relation_name of relation_names) {
    output_lines.push(`  ${relation_name}: ${incoming_summary[relation_name]}`);
  }

  return output_lines;
}
