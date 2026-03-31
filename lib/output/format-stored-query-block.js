/**
 * @import { OutputStoredQueryItem } from './output-view.types.ts';
 */

import { wrapCompactBodyText } from './compact-layout.js';
import { layoutStoredQueryRow } from './layout-stored-queries.js';

/**
 * @typedef {{
 *   kind: 'description' | 'field_name' | 'keyword' | 'literal' | 'name' | 'operator' | 'plain',
 *   text: string,
 * }} StoredQueryLineSegment
 */

/**
 * @param {OutputStoredQueryItem} output_item
 * @param {{ is_tty?: boolean, terminal_width?: number }} render_options
 * @param {{
 *   format_description?: (text: string) => string,
 *   format_line: (line_segments: StoredQueryLineSegment[]) => string,
 *   format_name: (text: string) => string,
 * }} format_options
 * @returns {string}
 */
export function formatStoredQueryBlock(
  output_item,
  render_options,
  format_options,
) {
  const row_layout = getStoredQueryRowLayout(output_item.name, render_options);
  const formatDescription = format_options.format_description ?? identity;
  const output_lines = layoutStoredQueryRow(
    output_item.where,
    row_layout.first_line_width,
    row_layout.continuation_width,
  ).map((line_segments, line_index) =>
    line_index === 0
      ? `${format_options.format_name(output_item.name)}  ${format_options.format_line(line_segments)}`
      : `${row_layout.continuation_prefix}${format_options.format_line(line_segments)}`,
  );

  if (output_item.description) {
    for (const description_line of wrapCompactBodyText(
      output_item.description,
      render_options,
    )) {
      output_lines.push(
        description_line.length > 0
          ? `  ${formatDescription(description_line)}`
          : '',
      );
    }
  }

  return output_lines.join('\n');
}

/**
 * @param {string} query_name
 * @param {{ is_tty?: boolean, terminal_width?: number }} render_options
 * @returns {{ continuation_prefix: string, continuation_width: number, first_line_width: number }}
 */
function getStoredQueryRowLayout(query_name, render_options) {
  const continuation_prefix = ' '.repeat(query_name.length + 2);

  if (
    render_options.is_tty !== true ||
    typeof render_options.terminal_width !== 'number'
  ) {
    return {
      continuation_prefix,
      continuation_width: Number.POSITIVE_INFINITY,
      first_line_width: Number.POSITIVE_INFINITY,
    };
  }

  const available_width = Math.max(
    1,
    render_options.terminal_width - continuation_prefix.length,
  );

  return {
    continuation_prefix,
    continuation_width: available_width,
    first_line_width: available_width,
  };
}

/**
 * @param {string} value
 * @returns {string}
 */
function identity(value) {
  return value;
}
