/**
 * @param {{ header: string, metadata_rows: string[], metadata_indent?: string, title: string, title_indent?: string }} options
 * @returns {string}
 */
export function formatOutputItemBlock(options) {
  const metadata_indent = options.metadata_indent ?? '';
  const title_indent = options.title_indent ?? '    ';
  /** @type {string[]} */
  const lines = [options.header];

  if (options.metadata_rows.length > 0) {
    lines.push(
      ...options.metadata_rows.map(
        (metadata_row) => `${metadata_indent}${metadata_row}`,
      ),
    );
  }

  lines.push('', `${title_indent}${options.title}`);

  return lines.join('\n');
}
