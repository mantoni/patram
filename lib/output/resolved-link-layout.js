/**
 * @import { OutputResolvedLinkItem } from './output-view.types.ts';
 */

import { wrapCompactBodyText } from './compact-layout.js';

/**
 * @param {OutputResolvedLinkItem} output_item
 * @returns {string}
 */
export function formatResolvedLinkHeader(output_item) {
  return `[${output_item.reference}] ${output_item.target.kind} ${output_item.target.path ?? output_item.target.id}`;
}

/**
 * @param {OutputResolvedLinkItem} output_item
 * @param {{ body_indent?: string, is_tty?: boolean, terminal_width?: number }} render_options
 * @returns {string[]}
 */
export function formatResolvedLinkBodyLines(output_item, render_options = {}) {
  const body_indent = render_options.body_indent ?? '    ';
  /** @type {string[]} */
  const output_lines = [`${body_indent}${output_item.target.title}`];

  if (!output_item.target.description) {
    return output_lines;
  }

  for (const description_line of wrapCompactBodyText(
    output_item.target.description,
    {
      body_indent,
      is_tty: render_options.is_tty,
      terminal_width: render_options.terminal_width,
    },
  )) {
    output_lines.push(
      description_line.length > 0 ? `${body_indent}${description_line}` : '',
    );
  }

  return output_lines;
}
