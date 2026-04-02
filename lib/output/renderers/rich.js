/* eslint-disable max-lines */
/**
 * @import { CliColorMode } from '../../cli/arguments.types.ts';
 * @import { OutputNodeItem, OutputResolvedLinkItem, OutputStoredQueryItem, OutputView, QueryOutputView, RefsOutputView, ShowOutputView } from '../output-view.types.ts';
 */

import { Ansis } from 'ansis';

import {
  formatOutputNodeStoredMetadataRow,
  formatResolvedLinkStoredMetadataRow,
} from '../format-output-metadata.js';
import {
  formatCompactMetadataLabel,
  formatCompactTitleRow,
  getCompactLeftTitleWidth,
  wrapCompactBodyText,
} from '../compact-layout.js';
import { formatNodeHeader } from '../format-node-header.js';
import { formatStoredQueryBlock } from '../format-stored-query-block.js';
import {
  collectIncomingRefHeaders,
  createIncomingTreeRenderOptions,
  layoutIncomingReferenceLines,
} from '../layout-incoming-references.js';
import { layoutIncomingSummaryLines } from '../layout-incoming-summary-lines.js';
import {
  formatResolvedLinkBodyLines,
  formatResolvedLinkHeader,
} from '../resolved-link-layout.js';
import { renderRichSource } from '../rich-source/render.js';

const FULL_WIDTH_DIVIDER = ` ${'─'.repeat(78)} `;

/**
 * Render styled rich output while preserving the plain layout.
 *
 * @param {OutputView} output_view
 * @param {{ color_mode: CliColorMode, color_enabled: boolean, is_tty?: boolean, terminal_width?: number }} render_options
 * @returns {Promise<string>}
 */
export async function renderRichOutput(output_view, render_options) {
  const ansi = createAnsi(render_options.color_enabled);

  if (output_view.command === 'query') {
    return renderRichQueryOutput(output_view, render_options, ansi);
  }

  if (output_view.command === 'queries') {
    return renderRichStoredQueries(output_view, render_options, ansi);
  }

  if (output_view.command === 'refs') {
    return renderRichRefsOutput(output_view, render_options, ansi);
  }
  if (output_view.command === 'show') {
    return renderRichShowOutput(output_view, render_options, ansi);
  }

  throw new Error('Unsupported output view command.');
}

/**
 * @param {QueryOutputView} output_view
 * @param {{ is_tty?: boolean, terminal_width?: number }} render_options
 * @param {Ansis} ansi
 * @returns {string}
 */
function renderRichQueryOutput(output_view, render_options, ansi) {
  const footer = renderRichQueryFooter(
    output_view.summary,
    output_view.hints,
    ansi,
  );

  if (output_view.items.length === 0) {
    return renderRichEmptyQuery(footer, ansi);
  }

  const left_title_width = getCompactLeftTitleWidth(
    output_view.items.map((output_item) => formatNodeHeader(output_item)),
  );
  const output_blocks = output_view.items.map((output_item) =>
    formatRichNodeItem(output_item, ansi, {
      ...render_options,
      left_title_width,
    }),
  );

  if (footer.length === 0) {
    return `${output_blocks.join('\n\n')}\n`;
  }

  return `${output_blocks.join('\n\n')}\n\n${footer}\n`;
}

/**
 * @param {string} footer
 * @param {Ansis} ansi
 * @returns {string}
 */
function renderRichEmptyQuery(footer, ansi) {
  if (footer.length === 0) {
    return `${ansi.yellow('No matches.')}\n`;
  }

  return `${ansi.yellow('No matches.')}\n${footer}\n`;
}

/**
 * @param {Extract<OutputView, { command: 'queries' }>} output_view
 * @param {{ is_tty?: boolean, terminal_width?: number }} render_options
 * @param {Ansis} ansi
 * @returns {string}
 */
function renderRichStoredQueries(output_view, render_options, ansi) {
  if (output_view.items.length === 0) {
    return '';
  }

  const output_blocks = output_view.items.map((output_item) =>
    formatRichStoredQueryBlock(output_item, ansi, render_options),
  );

  if (output_view.hints.length === 0) {
    return `${output_blocks.join('\n')}\n`;
  }

  return `${output_blocks.join('\n')}\n${output_view.hints.map((hint) => ansi.gray(hint)).join('\n')}\n`;
}

/**
 * @param {ShowOutputView} output_view
 * @param {{ color_mode: CliColorMode, color_enabled: boolean, is_tty?: boolean, terminal_width?: number }} render_options
 * @param {Ansis} ansi
 * @returns {Promise<string>}
 */
async function renderRichShowOutput(output_view, render_options, ansi) {
  const rendered_source = trimTrailingLineBreaks(
    await renderRichSource(output_view, render_options),
  );
  const incoming_summary = renderRichIncomingSummary(output_view, ansi);

  if (output_view.items.length === 0 && incoming_summary.length === 0) {
    return `${rendered_source}\n`;
  }

  const left_title_width = getCompactLeftTitleWidth(
    output_view.items.map(formatResolvedLinkHeader),
  );
  const summary_items = output_view.items.map((item) =>
    formatRichResolvedLinkItem(item, ansi, {
      is_tty: render_options.is_tty,
      left_title_width,
      terminal_width: render_options.terminal_width,
    }),
  );

  if (incoming_summary.length > 0) {
    summary_items.push(incoming_summary);
  }

  return `${rendered_source}\n\n${ansi.gray(FULL_WIDTH_DIVIDER)}\n\n${summary_items.join('\n\n')}\n`;
}

/**
 * @param {RefsOutputView} output_view
 * @param {{ is_tty?: boolean, terminal_width?: number }} render_options
 * @param {Ansis} ansi
 * @returns {string}
 */
function renderRichRefsOutput(output_view, render_options, ansi) {
  const left_title_width = getCompactLeftTitleWidth(
    collectIncomingRefHeaders(output_view),
  );
  const incoming_render_options =
    createIncomingTreeRenderOptions(render_options);
  const node_summary = formatRichNodeItem(output_view.node, ansi, {
    ...render_options,
    left_title_width,
  });
  const output_lines = layoutIncomingReferenceLines(output_view.incoming, {
    format_node_block(output_item) {
      return formatRichNodeItem(output_item, ansi, {
        ...incoming_render_options,
        left_title_width,
      });
    },
    format_relation_header(relation_name, relation_count) {
      return `${ansi.bold(relation_name)} ${ansi.gray(`(${relation_count})`)}`;
    },
  });

  return output_lines.length === 0
    ? `${node_summary}\n\n${ansi.yellow('No incoming references.')}\n`
    : `${node_summary}\n\n${output_lines.join('\n')}\n`;
}

/**
 * @param {OutputNodeItem} output_item
 * @param {Ansis} ansi
 * @param {{ is_tty?: boolean, left_title_width: number, terminal_width?: number }} render_options
 * @returns {string}
 */
function formatRichNodeItem(output_item, ansi, render_options) {
  const metadata_label = formatStoredMetadataLabel(
    formatOutputNodeStoredMetadataRow(output_item),
  );
  /** @type {string[]} */
  const output_lines = [
    formatCompactTitleRow({
      format_left(text) {
        return ansi.green(text);
      },
      format_right(text) {
        return formatRichCompactMetadataLabel(text, ansi);
      },
      is_tty: render_options.is_tty,
      left_title: formatNodeHeader(output_item),
      left_title_width: render_options.left_title_width,
      right_title: metadata_label,
      terminal_width: render_options.terminal_width,
    }),
  ];

  output_lines.push(`  ${output_item.title}`);

  if (output_item.description) {
    for (const description_line of wrapCompactBodyText(
      output_item.description,
      render_options,
    )) {
      output_lines.push(
        formatRichDescriptionLine(description_line, '  ', ansi),
      );
    }
  }

  return output_lines.join('\n');
}

/**
 * @param {{ kind: 'description' | 'field_name' | 'keyword' | 'literal' | 'name' | 'operator' | 'plain', text: string }[]} line_segments
 * @param {Ansis} ansi
 * @returns {string}
 */
function formatRichStoredQueryLine(line_segments, ansi) {
  return line_segments
    .map((line_segment) => styleStoredQuerySegment(line_segment, ansi))
    .join('');
}

/**
 * @param {OutputStoredQueryItem} output_item
 * @param {Ansis} ansi
 * @param {{ is_tty?: boolean, terminal_width?: number }} render_options
 * @returns {string}
 */
function formatRichStoredQueryBlock(output_item, ansi, render_options) {
  return formatStoredQueryBlock(output_item, render_options, {
    format_description(text) {
      return ansi.gray(text);
    },
    format_line(line_segments) {
      return formatRichStoredQueryLine(line_segments, ansi);
    },
    format_name(text) {
      return ansi.green(text);
    },
  });
}

/**
 * @param {OutputResolvedLinkItem} output_item
 * @param {Ansis} ansi
 * @param {{ is_tty?: boolean, left_title_width: number, terminal_width?: number }} render_options
 * @returns {string}
 */
function formatRichResolvedLinkItem(output_item, ansi, render_options) {
  const metadata_label = formatStoredMetadataLabel(
    formatResolvedLinkStoredMetadataRow(output_item.target),
  );
  /** @type {string[]} */
  const output_lines = [
    formatCompactTitleRow({
      format_left(text) {
        const closing_bracket_index = text.indexOf(']');

        if (closing_bracket_index === -1) {
          return ansi.green(text);
        }

        const reference_token = text.slice(0, closing_bracket_index + 1);
        const header_suffix = text.slice(closing_bracket_index + 1);

        return `${ansi.gray(reference_token)}${ansi.green(header_suffix)}`;
      },
      format_right(text) {
        return formatRichCompactMetadataLabel(text, ansi);
      },
      is_tty: render_options.is_tty,
      left_title: formatResolvedLinkHeader(output_item),
      left_title_width: render_options.left_title_width,
      right_title: metadata_label,
      terminal_width: render_options.terminal_width,
    }),
  ];

  output_lines.push(
    ...formatRichResolvedLinkBodyLines(output_item, ansi, {
      body_indent: '    ',
      is_tty: render_options.is_tty,
      terminal_width: render_options.terminal_width,
    }),
  );

  return output_lines.join('\n');
}

/**
 * @param {ShowOutputView} output_view
 * @param {Ansis} ansi
 * @returns {string}
 */
function renderRichIncomingSummary(output_view, ansi) {
  if (!hasIncomingSummary(output_view.incoming_summary)) {
    return '';
  }

  const output_lines = layoutIncomingSummaryLines(output_view.incoming_summary);
  output_lines[0] = ansi.bold(output_lines[0]);

  output_lines.push('', ansi.gray(`Hint: patram refs ${output_view.path}`));

  return output_lines.join('\n');
}

/**
 * @param {Record<string, number>} incoming_summary
 * @returns {boolean}
 */
function hasIncomingSummary(incoming_summary) {
  return Object.keys(incoming_summary).length > 0;
}

/**
 * @param {boolean} color_enabled
 * @returns {Ansis}
 */
function createAnsi(color_enabled) {
  return new Ansis(color_enabled ? 3 : 0);
}

/**
 * @param {string | undefined} metadata_row
 * @returns {string | undefined}
 */
function formatStoredMetadataLabel(metadata_row) {
  if (!metadata_row) {
    return undefined;
  }

  return formatCompactMetadataLabel([metadata_row]);
}

/**
 * @param {string} metadata_label
 * @param {Ansis} ansi
 * @returns {string}
 */
function formatRichCompactMetadataLabel(metadata_label, ansi) {
  return [...metadata_label]
    .map((character) =>
      character === '(' ||
      character === ')' ||
      character === ',' ||
      character === '='
        ? ansi.gray(character)
        : character,
    )
    .join('');
}

/**
 * @param {string} description_line
 * @param {string} indent
 * @param {Ansis} ansi
 * @returns {string}
 */
function formatRichDescriptionLine(description_line, indent, ansi) {
  if (description_line.length === 0) {
    return '';
  }

  return `${indent}${ansi.gray(description_line)}`;
}

/**
 * @param {OutputResolvedLinkItem} output_item
 * @param {Ansis} ansi
 * @param {{ body_indent?: string, is_tty?: boolean, terminal_width?: number }} render_options
 * @returns {string[]}
 */
function formatRichResolvedLinkBodyLines(output_item, ansi, render_options) {
  const body_indent = render_options.body_indent ?? '    ';
  const body_lines = formatResolvedLinkBodyLines(output_item, render_options);

  if (body_lines.length <= 1) {
    return body_lines;
  }

  return [
    body_lines[0],
    ...body_lines
      .slice(1)
      .map((line) =>
        formatRichIndentedDescriptionLine(line, body_indent, ansi),
      ),
  ];
}

/**
 * @param {string} line
 * @param {string} indent
 * @param {Ansis} ansi
 * @returns {string}
 */
function formatRichIndentedDescriptionLine(line, indent, ansi) {
  if (line.length === 0) {
    return '';
  }

  if (!line.startsWith(indent)) {
    return ansi.gray(line);
  }

  return `${indent}${ansi.gray(line.slice(indent.length))}`;
}

/**
 * @param {{ kind: 'description' | 'field_name' | 'keyword' | 'literal' | 'name' | 'operator' | 'plain', text: string }} line_segment
 * @param {Ansis} ansi
 * @returns {string}
 */
function styleStoredQuerySegment(line_segment, ansi) {
  if (line_segment.kind === 'name') {
    return ansi.green(line_segment.text);
  }

  if (line_segment.kind === 'description') {
    return ansi.gray(line_segment.text);
  }

  if (line_segment.kind === 'operator') {
    return ansi.gray(line_segment.text);
  }

  if (line_segment.kind === 'keyword') {
    return ansi.gray(line_segment.text);
  }

  return line_segment.text;
}

/**
 * @param {string} value
 * @returns {string}
 */
function trimTrailingLineBreaks(value) {
  return value.replace(/\n+$/du, '');
}

/**
 * @param {{ count: number, limit: number, offset: number, total_count: number }} summary
 * @returns {string}
 */
function formatQuerySummary(summary) {
  if (!shouldRenderQuerySummary(summary)) {
    return '';
  }

  return `Showing ${summary.count} of ${summary.total_count} matches.`;
}

/**
 * @param {{ count: number, limit: number, offset: number, total_count: number }} summary
 * @param {string[]} hints
 * @param {Ansis} ansi
 * @returns {string}
 */
function renderRichQueryFooter(summary, hints, ansi) {
  const summary_line = formatQuerySummary(summary);
  /** @type {string[]} */
  const footer_lines = [];

  if (summary_line.length > 0) {
    footer_lines.push(summary_line);
  }

  footer_lines.push(...hints.map((hint) => ansi.gray(hint)));

  return footer_lines.join('\n');
}

/**
 * @param {{ limit: number, offset: number, total_count: number }} summary
 * @returns {boolean}
 */
function shouldRenderQuerySummary(summary) {
  return summary.offset > 0 || summary.total_count > summary.limit;
}
