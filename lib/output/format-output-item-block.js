/**
 * @param {{ description?: string, header: string, metadata_rows: string[], metadata_indent?: string, title: string, title_indent?: string }} options
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

  if (options.description) {
    lines.push(
      '',
      ...formatIndentedDescription(options.description, title_indent),
    );
  }

  return lines.join('\n');
}

/**
 * @param {string} description
 * @param {string} indent
 * @returns {string[]}
 */
function formatIndentedDescription(description, indent) {
  /** @type {string[]} */
  const lines = [];
  const paragraphs = description.split('\n\n');

  for (const [paragraph_index, paragraph] of paragraphs.entries()) {
    if (paragraph_index > 0) {
      lines.push('');
    }

    for (const paragraph_line of paragraph.split('\n')) {
      lines.push(`${indent}${paragraph_line}`);
    }
  }

  return lines;
}
