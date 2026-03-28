/* eslint-disable max-lines */
/**
 * @import { ComarkElement, ComarkNode } from 'md4x';
 * @import { BundledLanguage } from 'shiki';
 * @import { CliColorMode } from '../../cli/arguments.types.ts';
 * @import { OutputResolvedLinkItem, ShowOutputView } from '../output-view.types.ts';
 */

import { extname } from 'node:path';

import { FontStyle } from '@shikijs/vscode-textmate';
import { Ansis } from 'ansis';
import { renderMermaidASCII } from 'beautiful-mermaid';
import { parseAST } from 'md4x';
import {
  bundledLanguages,
  bundledLanguagesAlias,
  codeToTokensBase,
  getSingletonHighlighter,
} from 'shiki';
import stringWidth from 'string-width';
import wrapAnsi from 'wrap-ansi';

const MARKDOWN_EXTENSIONS = new Set(['.markdown', '.md']);
const BLOCK_WIDTH = 80;
const CODE_SURFACE = 236;
const SHIKI_THEME = 'github-dark';
const URI_SCHEME_PATTERN = /^[A-Za-z][A-Za-z0-9+.-]*:/du;
/** @type {Record<string, string>} */
const SOURCE_LANGUAGE_BY_EXTENSION = {
  '.cjs': 'javascript',
  '.cts': 'typescript',
  '.js': 'javascript',
  '.json': 'json',
  '.jsx': 'jsx',
  '.mjs': 'javascript',
  '.mts': 'typescript',
  '.tsx': 'tsx',
  '.ts': 'typescript',
  '.yaml': 'yaml',
  '.yml': 'yaml',
};

const SHIKI_LANGUAGE_NAMES = new Set([
  ...Object.keys(bundledLanguages),
  ...Object.keys(bundledLanguagesAlias),
]);

/**
 * @typedef {{
 *   ansi: Ansis,
 *   next_reference: number,
 *   next_top_level_list: number,
 *   resolved_links: OutputResolvedLinkItem[],
 *   top_level_list_item_gaps: boolean[][]
 * }} RichSourceRenderState
 */

/**
 * @param {ShowOutputView} output_view
 * @param {{ color_mode: CliColorMode, color_enabled: boolean }} render_options
 * @returns {Promise<string>}
 */
export async function renderRichSource(output_view, render_options) {
  const ansi = createAnsi(render_options.color_enabled);

  if (isMarkdownPath(output_view.path)) {
    return renderRichMarkdownSource(output_view, ansi);
  }

  return renderRichSourceFile(output_view.path, output_view.source, ansi);
}

/**
 * @param {ShowOutputView} output_view
 * @param {Ansis} ansi
 * @returns {Promise<string>}
 */
async function renderRichMarkdownSource(output_view, ansi) {
  const markdown_tree = parseAST(output_view.source);
  /** @type {string[]} */
  const rendered_blocks = [];
  /** @type {RichSourceRenderState} */
  const render_state = {
    ansi,
    next_reference: 1,
    next_top_level_list: 0,
    resolved_links: output_view.items,
    top_level_list_item_gaps: collectTopLevelListItemGaps(output_view.source),
  };

  for (const node of markdown_tree.nodes) {
    const rendered_block = await renderBlockNode(node, render_state, 0);

    if (rendered_block.length > 0) {
      rendered_blocks.push(rendered_block);
    }
  }

  return rendered_blocks.join('\n\n');
}

/**
 * @param {string} source_path
 * @param {string} source_text
 * @param {Ansis} ansi
 * @returns {Promise<string>}
 */
async function renderRichSourceFile(source_path, source_text, ansi) {
  const source_language = detectSourceLanguage(source_path);
  const source_lines = await renderHighlightedLines(
    source_text,
    source_language,
    ansi,
  );

  return renderCodeBlock(source_lines, source_language ?? '', null, 0, ansi);
}

/**
 * @param {ComarkNode} node
 * @param {RichSourceRenderState} render_state
 * @param {number} indent_level
 * @returns {Promise<string>}
 */
async function renderBlockNode(node, render_state, indent_level) {
  if (typeof node === 'string') {
    return node;
  }

  const node_tag = getElementTag(node);
  const node_children = getElementChildren(node);

  if (isHeadingTag(node_tag)) {
    return renderHeading(node_tag, node_children, render_state.ansi);
  }

  if (node_tag === 'p') {
    return renderInlineNodes(node_children, render_state);
  }

  if (node_tag === 'pre') {
    return renderFencedCodeBlock(node, indent_level, render_state.ansi);
  }

  if (isListTag(node_tag)) {
    return renderListBlock(
      /** @type {'ol' | 'ul'} */ (node_tag),
      node_children,
      render_state,
      indent_level,
      indent_level === 0 ? getNextTopLevelListItemGaps(render_state) : [],
    );
  }

  if (node_tag === 'blockquote') {
    return renderBlockquote(node_children, render_state, indent_level);
  }

  if (node_tag === 'hr') {
    return renderDivider(render_state.ansi);
  }

  if (node_tag === 'table') {
    return renderTable(node_children);
  }

  return renderInlineNodes(node_children, render_state);
}

/**
 * @param {ComarkNode[]} nodes
 * @param {RichSourceRenderState} render_state
 * @returns {string}
 */
function renderInlineNodes(nodes, render_state) {
  /** @type {string[]} */
  const rendered_chunks = [];

  for (const node of nodes) {
    if (typeof node === 'string') {
      rendered_chunks.push(node);
      continue;
    }

    const node_tag = getElementTag(node);
    const node_children = getElementChildren(node);

    if (node_tag === 'strong') {
      rendered_chunks.push(
        render_state.ansi.bold(renderInlineNodes(node_children, render_state)),
      );
      continue;
    }

    if (node_tag === 'em') {
      rendered_chunks.push(
        render_state.ansi.italic(
          renderInlineNodes(node_children, render_state),
        ),
      );
      continue;
    }

    if (node_tag === 'code') {
      rendered_chunks.push(renderInlineCode(node_children, render_state.ansi));
      continue;
    }

    if (node_tag === 'a') {
      rendered_chunks.push(renderLinkNode(node, render_state));
      continue;
    }

    if (node_tag === 's') {
      rendered_chunks.push(
        render_state.ansi.strikethrough(
          renderInlineNodes(node_children, render_state),
        ),
      );
      continue;
    }

    if (node_tag === 'br') {
      rendered_chunks.push('\n');
      continue;
    }

    rendered_chunks.push(renderInlineNodes(node_children, render_state));
  }

  return rendered_chunks.join('');
}

/**
 * @param {'ol' | 'ul'} nodes_type
 * @param {ComarkNode[]} nodes
 * @param {RichSourceRenderState} render_state
 * @param {number} indent_level
 * @param {boolean[]} list_item_gaps
 * @returns {Promise<string>}
 */
async function renderListBlock(
  nodes_type,
  nodes,
  render_state,
  indent_level,
  list_item_gaps,
) {
  /** @type {string[]} */
  const rendered_items = [];
  /** @type {ComarkElement | null} */
  let previous_item = null;
  let rendered_item_count = 0;

  for (let item_index = 0; item_index < nodes.length; item_index += 1) {
    const node = nodes[item_index];

    if (typeof node === 'string' || getElementTag(node) !== 'li') {
      continue;
    }

    if (
      previous_item &&
      shouldRenderListItemGap(
        previous_item,
        node,
        list_item_gaps[rendered_item_count - 1] ?? false,
      )
    ) {
      rendered_items.push('');
    }

    rendered_items.push(
      await renderListItem(
        node,
        item_index + 1,
        nodes_type === 'ol',
        render_state,
        indent_level,
      ),
    );
    previous_item = node;
    rendered_item_count += 1;
  }

  return rendered_items.join('\n');
}

/**
 * @param {ComarkElement} node
 * @param {number} item_number
 * @param {boolean} is_ordered
 * @param {RichSourceRenderState} render_state
 * @param {number} indent_level
 * @returns {Promise<string>}
 */
async function renderListItem(
  node,
  item_number,
  is_ordered,
  render_state,
  indent_level,
) {
  const item_prefix = `${'  '.repeat(indent_level)}${is_ordered ? `${item_number}.` : '•'} `;
  const followup_prefix = '  '.repeat(indent_level);
  const { block_nodes, lead_text } = collectListItemParts(node, render_state);

  /** @type {string[]} */
  const rendered_parts =
    lead_text === null
      ? [item_prefix.trimEnd()]
      : renderListParagraph(lead_text, item_prefix, followup_prefix);

  for (const block_node of block_nodes) {
    const block_tag = getElementTag(block_node);

    if (block_tag === 'p') {
      rendered_parts.push(
        ...renderParagraphLines(
          renderInlineNodes(getElementChildren(block_node), render_state),
          followup_prefix,
        ),
      );
      continue;
    }

    const rendered_block = await renderBlockNode(
      block_node,
      render_state,
      indent_level + 1,
    );

    rendered_parts.push(rendered_block);
  }

  return rendered_parts.join('\n');
}

/**
 * @param {ComarkNode[]} nodes
 * @param {RichSourceRenderState} render_state
 * @param {number} indent_level
 * @returns {Promise<string>}
 */
async function renderBlockquote(nodes, render_state, indent_level) {
  /** @type {string[]} */
  const rendered_blocks = [];

  for (const node of nodes) {
    const rendered_block = await renderBlockNode(
      node,
      render_state,
      indent_level,
    );

    if (rendered_block.length > 0) {
      rendered_blocks.push(rendered_block);
    }
  }

  return renderQuoteBlock(
    rendered_blocks.join('\n\n'),
    indent_level,
    render_state.ansi,
  );
}

/**
 * @param {ComarkNode[]} nodes
 * @returns {string}
 */
function renderTable(nodes) {
  const table_rows = extractTableRows(nodes);

  if (table_rows.length === 0) {
    return '';
  }

  /** @type {number[]} */
  const column_widths = [];

  for (const row of table_rows) {
    for (let column_index = 0; column_index < row.length; column_index += 1) {
      const cell_text = row[column_index];
      const current_width = column_widths[column_index] ?? 0;

      column_widths[column_index] = Math.max(current_width, cell_text.length);
    }
  }

  /** @type {string[]} */
  const rendered_lines = [formatTableRow(table_rows[0], column_widths)];

  rendered_lines.push(formatTableDivider(column_widths));

  for (let row_index = 1; row_index < table_rows.length; row_index += 1) {
    rendered_lines.push(formatTableRow(table_rows[row_index], column_widths));
  }

  return rendered_lines.join('\n');
}

/**
 * @param {ComarkElement} node
 * @param {number} indent_level
 * @param {Ansis} ansi
 * @returns {Promise<string>}
 */
async function renderFencedCodeBlock(node, indent_level, ansi) {
  const node_props = getElementProps(node);
  const code_node = getElementChildren(node)[0];
  const raw_language =
    typeof node_props.language === 'string' ? node_props.language : '';
  const source_language = normalizeShikiLanguage(raw_language);
  const file_name =
    typeof node_props.filename === 'string' ? node_props.filename : null;
  const source_text =
    typeof code_node === 'string'
      ? code_node
      : extractInlineText(getElementChildren(code_node));

  if (isMermaidFence(raw_language)) {
    return renderMermaidBlock(
      source_text,
      raw_language,
      file_name,
      indent_level,
      ansi,
    );
  }

  const rendered_lines = await renderHighlightedLines(
    source_text,
    source_language,
    ansi,
  );

  return renderCodeBlock(
    rendered_lines,
    raw_language,
    file_name,
    indent_level,
    ansi,
    true,
    1,
  );
}

/**
 * @param {string} source_text
 * @param {string} language_label
 * @param {string | null} file_name
 * @param {number} indent_level
 * @param {Ansis} ansi
 * @returns {string}
 */
function renderMermaidBlock(
  source_text,
  language_label,
  file_name,
  indent_level,
  ansi,
) {
  const rendered_lines = splitRenderedLines(
    renderMermaidASCII(stripSingleTrailingLineBreak(source_text), {
      boxBorderPadding: 0,
      colorMode: 'none',
    }),
  );

  return renderCodeBlock(
    rendered_lines,
    language_label,
    file_name,
    indent_level,
    ansi,
    true,
    1,
  );
}

/**
 * @param {string} tag_name
 * @param {ComarkNode[]} nodes
 * @param {Ansis} ansi
 * @returns {string}
 */
function renderHeading(tag_name, nodes, ansi) {
  const heading_text = extractInlineText(nodes);

  if (heading_text.length === 0) {
    return '';
  }

  return styleHeadingText(
    `${'#'.repeat(getHeadingLevel(tag_name))} ${heading_text}`,
    tag_name,
    ansi,
  );
}

/**
 * @param {ComarkElement} node
 * @param {RichSourceRenderState} render_state
 * @returns {string}
 */
function renderLinkNode(node, render_state) {
  const node_children = getElementChildren(node);
  const node_props = getElementProps(node);
  const link_text = renderInlineNodes(node_children, render_state);
  const target_value =
    typeof node_props.href === 'string' ? node_props.href : null;

  if (!isPathLikeMarkdownTarget(target_value)) {
    return render_state.ansi.underline(link_text);
  }

  const resolved_link =
    render_state.resolved_links[render_state.next_reference - 1];

  render_state.next_reference += 1;

  if (!resolved_link) {
    return render_state.ansi.underline(link_text);
  }

  return `${render_state.ansi.underline(link_text)}${render_state.ansi.gray(`[${resolved_link.reference}]`)}`;
}

/**
 * @param {string} source_text
 * @param {string | null} source_language
 * @param {Ansis} ansi
 * @returns {Promise<string[]>}
 */
async function renderHighlightedLines(source_text, source_language, ansi) {
  const normalized_source = stripSingleTrailingLineBreak(source_text);

  if (!source_language) {
    return splitRenderedLines(normalized_source);
  }

  const highlighted_source = await highlightSourceText(
    normalized_source,
    source_language,
    ansi,
  );

  return splitRenderedLines(highlighted_source);
}

/**
 * @param {string} source_text
 * @param {string} source_language
 * @param {Ansis} ansi
 * @returns {Promise<string>}
 */
async function highlightSourceText(source_text, source_language, ansi) {
  const token_lines = await codeToTokensBase(source_text, {
    lang: /** @type {BundledLanguage} */ (source_language),
    theme: SHIKI_THEME,
  });
  const highlighter = await getSingletonHighlighter();
  const theme_registration = highlighter.getTheme(SHIKI_THEME);
  let highlighted_source = '';

  for (const token_line of token_lines) {
    for (const token of token_line) {
      highlighted_source += styleHighlightedToken(
        token,
        theme_registration,
        ansi,
      );
    }

    highlighted_source += '\n';
  }

  return highlighted_source;
}

/**
 * @param {{ color?: string, content: string, fontStyle?: number }} token
 * @param {{ fg?: string, type: string }} theme_registration
 * @param {Ansis} ansi
 * @returns {string}
 */
function styleHighlightedToken(token, theme_registration, ansi) {
  let token_text = token.content;
  const token_color = token.color ?? theme_registration.fg;

  if (token_color) {
    token_text = ansi.hex(applyHexAlpha(token_color, theme_registration.type))(
      token_text,
    );
  }

  if (!token.fontStyle) {
    return token_text;
  }

  if (token.fontStyle & FontStyle.Bold) {
    token_text = ansi.bold(token_text);
  }

  if (token.fontStyle & FontStyle.Italic) {
    token_text = ansi.italic(token_text);
  }

  if (token.fontStyle & FontStyle.Underline) {
    token_text = ansi.underline(token_text);
  }

  if (token.fontStyle & FontStyle.Strikethrough) {
    token_text = ansi.strikethrough(token_text);
  }

  return token_text;
}

/**
 * @param {string} language_label
 * @param {string | null} file_name
 * @returns {string}
 */
function formatCodeBlockLabel(language_label, file_name) {
  /** @type {string[]} */
  const label_parts = [];

  if (language_label.length > 0) {
    label_parts.push(language_label);
  }

  if (file_name) {
    label_parts.push(`[${file_name}]`);
  }

  return label_parts.join(' ');
}

/**
 * @param {string[]} source_lines
 * @param {string} language_label
 * @param {string | null} file_name
 * @param {number} indent_level
 * @param {Ansis} ansi
 * @param {boolean} add_bottom_spacer
 * @param {number} content_indent
 * @returns {string}
 */
function renderCodeBlock(
  source_lines,
  language_label,
  file_name,
  indent_level,
  ansi,
  add_bottom_spacer = false,
  content_indent = 0,
) {
  const label = formatCodeBlockLabel(language_label, file_name);
  const content_width = measureCodeBlockWidth(
    label,
    source_lines,
    content_indent,
  );
  /** @type {string[]} */
  const rendered_lines = [];

  if (label.length > 0) {
    rendered_lines.push(
      renderCodeBlockLabelLine(label, content_width, indent_level, ansi),
    );
  }

  for (const source_line of source_lines) {
    rendered_lines.push(
      renderCodeBlockContentLine(
        source_line,
        content_width,
        indent_level,
        ansi,
        content_indent,
      ),
    );
  }

  if (add_bottom_spacer) {
    rendered_lines.push(
      renderCodeBlockContentLine(
        '',
        content_width,
        indent_level,
        ansi,
        content_indent,
      ),
    );
  }

  return rendered_lines.join('\n');
}

/**
 * @param {ComarkNode[]} nodes
 * @returns {string[][]}
 */
function extractTableRows(nodes) {
  /** @type {string[][]} */
  const table_rows = [];

  for (const node of nodes) {
    if (typeof node === 'string') {
      continue;
    }

    const node_tag = getElementTag(node);

    if (node_tag !== 'thead' && node_tag !== 'tbody') {
      continue;
    }

    for (const row_node of getElementChildren(node)) {
      if (typeof row_node === 'string' || getElementTag(row_node) !== 'tr') {
        continue;
      }

      table_rows.push(extractTableRowCells(row_node));
    }
  }

  return table_rows;
}

/**
 * @param {string[]} row_cells
 * @param {number[]} column_widths
 * @returns {string}
 */
function formatTableRow(row_cells, column_widths) {
  /** @type {string[]} */
  const padded_cells = [];

  for (
    let column_index = 0;
    column_index < column_widths.length;
    column_index += 1
  ) {
    const cell_text = row_cells[column_index] ?? '';

    padded_cells.push(cell_text.padEnd(column_widths[column_index], ' '));
  }

  return `| ${padded_cells.join(' | ')} |`;
}

/**
 * @param {number[]} column_widths
 * @returns {string}
 */
function formatTableDivider(column_widths) {
  /** @type {string[]} */
  const divider_cells = [];

  for (const column_width of column_widths) {
    divider_cells.push('-'.repeat(column_width));
  }

  return `|-${divider_cells.join('-|-')}-|`;
}

/**
 * @param {ComarkNode[]} nodes
 * @returns {string}
 */
function extractInlineText(nodes) {
  /** @type {string[]} */
  const rendered_chunks = [];

  for (const node of nodes) {
    if (typeof node === 'string') {
      rendered_chunks.push(node);
      continue;
    }

    rendered_chunks.push(extractInlineText(getElementChildren(node)));
  }

  return rendered_chunks.join('');
}

/**
 * @param {ComarkNode[]} nodes
 * @param {Ansis} ansi
 * @returns {string}
 */
function renderInlineCode(nodes, ansi) {
  const code_text = extractInlineText(nodes);
  const hidden_tick = ansi.bg(CODE_SURFACE).fg(CODE_SURFACE)('`');
  const visible_code = ansi.bg(CODE_SURFACE).dim(code_text);

  return `${hidden_tick}${visible_code}${hidden_tick}`;
}

/**
 * @param {ComarkElement} row_node
 * @returns {string[]}
 */
function extractTableRowCells(row_node) {
  /** @type {string[]} */
  const row_cells = [];

  for (const cell_node of getElementChildren(row_node)) {
    if (typeof cell_node === 'string') {
      continue;
    }

    row_cells.push(extractInlineText(getElementChildren(cell_node)));
  }

  return row_cells;
}

/**
 * @param {ComarkElement} node
 * @param {RichSourceRenderState} render_state
 * @returns {{ block_nodes: ComarkElement[], lead_text: string | null }}
 */
function collectListItemParts(node, render_state) {
  const node_children = getElementChildren(node);
  /** @type {ComarkElement[]} */
  const block_nodes = [];
  /** @type {string | null} */
  let lead_text = null;

  for (
    let child_index = 0;
    child_index < node_children.length;
    child_index += 1
  ) {
    const child = node_children[child_index];

    if (typeof child === 'string') {
      lead_text = appendLeadText(
        lead_text,
        renderInlineNodes([child], render_state),
      );
      continue;
    }

    const child_tag = getElementTag(child);

    if (child_tag === 'p') {
      const paragraph_text = renderInlineNodes(
        getElementChildren(child),
        render_state,
      );

      if (lead_text === null) {
        lead_text = paragraph_text;
        continue;
      }

      block_nodes.push(child);
      continue;
    }

    if (isBlockTag(child_tag)) {
      block_nodes.push(child);
      continue;
    }

    lead_text = appendLeadText(
      lead_text,
      renderInlineNodes([child], render_state),
    );
  }

  return {
    block_nodes,
    lead_text,
  };
}

/**
 * @param {{ next_top_level_list: number, top_level_list_item_gaps: boolean[][] }} render_state
 * @returns {boolean[]}
 */
function getNextTopLevelListItemGaps(render_state) {
  const list_item_gaps =
    render_state.top_level_list_item_gaps[render_state.next_top_level_list];

  render_state.next_top_level_list += 1;

  return list_item_gaps ?? [];
}

/**
 * @param {string} source_text
 * @returns {boolean[][]}
 */
function collectTopLevelListItemGaps(source_text) {
  const source_lines = source_text.split('\n');
  /** @type {boolean[][]} */
  const top_level_list_item_gaps = [];
  /** @type {boolean[] | null} */
  let current_list_item_gaps = null;
  let saw_blank_line = false;
  /** @type {{ character: '`' | '~', length: number } | null} */
  let active_fence = null;

  for (const source_line of source_lines) {
    if (active_fence) {
      if (isClosingTopLevelFenceLine(source_line, active_fence)) {
        active_fence = null;
      }

      continue;
    }

    const top_level_fence = parseTopLevelFence(source_line);

    if (top_level_fence) {
      active_fence = top_level_fence;
      current_list_item_gaps = null;
      saw_blank_line = false;
      continue;
    }

    if (source_line.trim().length === 0) {
      saw_blank_line = current_list_item_gaps !== null;
      continue;
    }

    if (isTopLevelListItemLine(source_line)) {
      current_list_item_gaps = pushTopLevelListItemGap(
        current_list_item_gaps,
        top_level_list_item_gaps,
        saw_blank_line,
      );
      saw_blank_line = false;
      continue;
    }

    if (current_list_item_gaps === null) {
      continue;
    }

    if (source_line.startsWith(' ') || source_line.startsWith('\t')) {
      saw_blank_line = false;
      continue;
    }

    current_list_item_gaps = null;
    saw_blank_line = false;
  }

  return top_level_list_item_gaps;
}

/**
 * @param {ComarkElement} previous_item
 * @param {ComarkElement} next_item
 * @param {boolean} has_blank_line_gap
 * @returns {boolean}
 */
function shouldRenderListItemGap(previous_item, next_item, has_blank_line_gap) {
  if (!has_blank_line_gap) {
    return false;
  }

  return (
    isSimpleTopLevelListItem(previous_item) &&
    isSimpleTopLevelListItem(next_item)
  );
}

/**
 * @param {ComarkElement} item_node
 * @returns {boolean}
 */
function isSimpleTopLevelListItem(item_node) {
  const item_children = getElementChildren(item_node);

  if (item_children.length !== 1) {
    return false;
  }

  const paragraph_node = item_children[0];

  if (
    typeof paragraph_node === 'string' ||
    getElementTag(paragraph_node) !== 'p'
  ) {
    return false;
  }

  return !extractInlineText(getElementChildren(paragraph_node)).includes('\n');
}

/**
 * @param {string} source_line
 * @returns {boolean}
 */
function isTopLevelListItemLine(source_line) {
  return /^([*+-]|\d+[.)])(?:\s+|$)/du.test(source_line);
}

/**
 * @param {string} source_line
 * @returns {{ character: '`' | '~', length: number } | null}
 */
function parseTopLevelFence(source_line) {
  const fence_match = /^(?<character>`|~)\k<character>{2,}/du.exec(source_line);

  if (!fence_match?.groups?.character) {
    return null;
  }

  return {
    character: /** @type {'`' | '~'} */ (fence_match.groups.character),
    length: fence_match[0].length,
  };
}

/**
 * @param {string} source_line
 * @param {{ character: '`' | '~', length: number }} active_fence
 * @returns {boolean}
 */
function isClosingTopLevelFenceLine(source_line, active_fence) {
  const closing_pattern = new RegExp(
    `^${active_fence.character}{${active_fence.length},}\\s*$`,
    'u',
  );

  return closing_pattern.test(source_line);
}

/**
 * @param {boolean[] | null} current_list_item_gaps
 * @param {boolean[][]} top_level_list_item_gaps
 * @param {boolean} saw_blank_line
 * @returns {boolean[]}
 */
function pushTopLevelListItemGap(
  current_list_item_gaps,
  top_level_list_item_gaps,
  saw_blank_line,
) {
  if (current_list_item_gaps === null) {
    current_list_item_gaps = [];
    top_level_list_item_gaps.push(current_list_item_gaps);
    return current_list_item_gaps;
  }

  current_list_item_gaps.push(saw_blank_line);

  return current_list_item_gaps;
}

/**
 * @param {string} text
 * @param {string} item_prefix
 * @param {string} followup_prefix
 * @returns {string[]}
 */
function renderListParagraph(text, item_prefix, followup_prefix) {
  const hanging_prefix = `${' '.repeat(stringWidth(item_prefix))}${followup_prefix.slice(item_prefix.length)}`;

  return renderWrappedPrefixedLines(
    text,
    item_prefix,
    hanging_prefix,
    hanging_prefix,
  );
}

/**
 * @param {string} text
 * @param {string} prefix
 * @returns {string[]}
 */
function renderParagraphLines(text, prefix) {
  return renderWrappedPrefixedLines(text, prefix, prefix, prefix);
}

/**
 * @param {string} value
 * @param {number} indent_level
 * @param {Ansis} ansi
 * @returns {string}
 */
function renderQuoteBlock(value, indent_level, ansi) {
  const indent_prefix = '  '.repeat(indent_level);
  const quote_lines = value.split('\n');
  const content_width = measureMaxLineWidth(quote_lines) + 1;

  return quote_lines
    .map((line) =>
      renderQuoteLine(
        padRenderedLine(line, content_width),
        indent_prefix,
        ansi,
      ),
    )
    .join('\n');
}

/**
 * @param {string} line
 * @param {string} indent_prefix
 * @param {Ansis} ansi
 * @returns {string}
 */
function renderQuoteLine(line, indent_prefix, ansi) {
  const quote_border = ansi.bgGray.gray('▕');
  const quote_body = ansi.bgGray(` ${line}`);

  return `${indent_prefix}${quote_border}${quote_body}`;
}

/**
 * @param {string} source_path
 * @returns {string | null}
 */
function detectSourceLanguage(source_path) {
  const source_extension = extname(source_path).toLowerCase();
  const mapped_language = SOURCE_LANGUAGE_BY_EXTENSION[source_extension];

  if (mapped_language) {
    return mapped_language;
  }

  if (source_extension.length === 0) {
    return null;
  }

  return normalizeShikiLanguage(source_extension.slice(1));
}

/**
 * @param {string} language_name
 * @returns {string | null}
 */
function normalizeShikiLanguage(language_name) {
  const normalized_language = language_name.toLowerCase();

  if (SHIKI_LANGUAGE_NAMES.has(normalized_language)) {
    return normalized_language;
  }

  return null;
}

/**
 * @param {string} language_name
 * @returns {boolean}
 */
function isMermaidFence(language_name) {
  return language_name.toLowerCase() === 'mermaid';
}

/**
 * @param {string | null} existing_value
 * @param {string} value
 * @returns {string}
 */
function appendLeadText(existing_value, value) {
  if (existing_value === null) {
    return value;
  }

  return `${existing_value}${value}`;
}

/**
 * @param {string} value
 * @returns {string[]}
 */
function splitRenderedLines(value) {
  const normalized_value = value.replace(/\n+$/du, '');

  if (normalized_value.length === 0) {
    return [''];
  }

  return normalized_value.split('\n');
}

/**
 * @param {string} value
 * @returns {string}
 */
function stripSingleTrailingLineBreak(value) {
  return value.replace(/\n$/u, '');
}

/**
 * @param {string} source_path
 * @returns {boolean}
 */
function isMarkdownPath(source_path) {
  return MARKDOWN_EXTENSIONS.has(extname(source_path).toLowerCase());
}

/**
 * @param {string | null} target_value
 * @returns {boolean}
 */
function isPathLikeMarkdownTarget(target_value) {
  if (!target_value || target_value.startsWith('#')) {
    return false;
  }

  return !URI_SCHEME_PATTERN.test(target_value);
}

/**
 * @param {string} tag_name
 * @returns {boolean}
 */
function isHeadingTag(tag_name) {
  return /^h[1-6]$/du.test(tag_name);
}

/**
 * @param {string} tag_name
 * @returns {boolean}
 */
function isListTag(tag_name) {
  return tag_name === 'ol' || tag_name === 'ul';
}

/**
 * @param {string} tag_name
 * @returns {number}
 */
function getHeadingLevel(tag_name) {
  return Number.parseInt(tag_name.slice(1), 10);
}

/**
 * @param {string} tag_name
 * @returns {boolean}
 */
function isBlockTag(tag_name) {
  return (
    tag_name === 'blockquote' ||
    tag_name === 'ol' ||
    tag_name === 'pre' ||
    tag_name === 'table' ||
    tag_name === 'ul'
  );
}

/**
 * @param {ComarkElement} node
 * @returns {string}
 */
function getElementTag(node) {
  return node[0] ?? '';
}

/**
 * @param {ComarkElement} node
 * @returns {Record<string, unknown>}
 */
function getElementProps(node) {
  return /** @type {Record<string, unknown>} */ (node[1]);
}

/**
 * @param {ComarkElement} node
 * @returns {ComarkNode[]}
 */
function getElementChildren(node) {
  return /** @type {ComarkNode[]} */ (node.slice(2));
}

/**
 * @param {string} text
 * @param {string} tag_name
 * @param {Ansis} ansi
 * @returns {string}
 */
function styleHeadingText(text, tag_name, ansi) {
  if (tag_name === 'h1') {
    return ansi.bold.red(text);
  }

  return ansi.bold.blueBright(text);
}

/**
 * @param {Ansis} ansi
 * @returns {string}
 */
function renderDivider(ansi) {
  return ansi.gray(` ${'─'.repeat(BLOCK_WIDTH - 2)} `);
}

/**
 * @param {string} label
 * @param {number} content_width
 * @param {number} indent_level
 * @param {Ansis} ansi
 * @returns {string}
 */
function renderCodeBlockLabelLine(label, content_width, indent_level, ansi) {
  return renderCodeBlockLine(
    padLeftRenderedLine(label, content_width),
    content_width,
    indent_level,
    ansi,
  );
}

/**
 * @param {string} source_line
 * @param {number} content_width
 * @param {number} indent_level
 * @param {Ansis} ansi
 * @param {number} content_indent
 * @returns {string}
 */
function renderCodeBlockContentLine(
  source_line,
  content_width,
  indent_level,
  ansi,
  content_indent = 0,
) {
  return renderCodeBlockLine(
    source_line,
    content_width,
    indent_level,
    ansi,
    content_indent,
  );
}

/**
 * @param {string} line
 * @param {number} content_width
 * @param {number} indent_level
 * @param {Ansis} ansi
 * @param {number} content_indent
 * @returns {string}
 */
function renderCodeBlockLine(
  line,
  content_width,
  indent_level,
  ansi,
  content_indent = 0,
) {
  const padded_line = padRenderedLine(
    `${' '.repeat(content_indent)}${line}`,
    content_width,
  );
  const code_body = ansi.bg(CODE_SURFACE)(` ${padded_line} `);

  return `${'  '.repeat(indent_level)}${code_body}`;
}

/**
 * @param {string} label
 * @param {string[]} source_lines
 * @param {number} content_indent
 * @returns {number}
 */
function measureCodeBlockWidth(label, source_lines, content_indent = 0) {
  return Math.max(
    BLOCK_WIDTH - 2,
    stringWidth(label),
    measureMaxLineWidth(source_lines) + content_indent,
  );
}

/**
 * @param {string} text
 * @param {string} first_prefix
 * @param {string} next_prefix
 * @param {string} continuation_prefix
 * @returns {string[]}
 */
function renderWrappedPrefixedLines(
  text,
  first_prefix,
  next_prefix,
  continuation_prefix,
) {
  const source_lines = text.split('\n');
  /** @type {string[]} */
  const rendered_lines = [];

  for (
    let source_line_index = 0;
    source_line_index < source_lines.length;
    source_line_index += 1
  ) {
    const source_line = source_lines[source_line_index];
    const line_prefix = source_line_index === 0 ? first_prefix : next_prefix;

    rendered_lines.push(
      ...wrapPrefixedLine(source_line, line_prefix, continuation_prefix),
    );
  }

  return rendered_lines;
}

/**
 * @param {string} line
 * @param {string} first_prefix
 * @param {string} continuation_prefix
 * @returns {string[]}
 */
function wrapPrefixedLine(line, first_prefix, continuation_prefix) {
  if (line.length === 0) {
    return [first_prefix];
  }

  const wrapped_line = wrapAnsi(
    line,
    Math.max(BLOCK_WIDTH - stringWidth(first_prefix), 1),
    {
      hard: false,
      trim: false,
      wordWrap: true,
    },
  );
  const wrapped_segments = splitRenderedLines(wrapped_line);

  return wrapped_segments.map((segment, segment_index) => {
    const normalized_segment = segment.replace(/\s+$/u, '');

    if (segment_index === 0) {
      return `${first_prefix}${normalized_segment}`;
    }

    return `${continuation_prefix}${normalized_segment}`;
  });
}

/**
 * @param {string[]} lines
 * @returns {number}
 */
function measureMaxLineWidth(lines) {
  let max_width = 0;

  for (const line of lines) {
    max_width = Math.max(max_width, stringWidth(line));
  }

  return max_width;
}

/**
 * @param {string} line
 * @param {number} content_width
 * @returns {string}
 */
function padRenderedLine(line, content_width) {
  return `${line}${' '.repeat(Math.max(content_width - stringWidth(line), 0))}`;
}

/**
 * @param {string} line
 * @param {number} content_width
 * @returns {string}
 */
function padLeftRenderedLine(line, content_width) {
  return `${' '.repeat(Math.max(content_width - stringWidth(line), 0))}${line}`;
}

/**
 * @param {boolean} color_enabled
 * @returns {Ansis}
 */
function createAnsi(color_enabled) {
  return new Ansis(color_enabled ? 3 : 0);
}

/**
 * @param {string} hex_value
 * @returns {{ r: number, g: number, b: number, a: number }}
 */
function hexToRgba(hex_value) {
  const normalized_hex = normalizeHex(hex_value);

  return {
    a: Number.parseInt(normalized_hex.slice(6, 8), 16) / 255,
    b: Number.parseInt(normalized_hex.slice(4, 6), 16),
    g: Number.parseInt(normalized_hex.slice(2, 4), 16),
    r: Number.parseInt(normalized_hex.slice(0, 2), 16),
  };
}

/**
 * @param {number} red_value
 * @param {number} green_value
 * @param {number} blue_value
 * @returns {string}
 */
function rgbToHex(red_value, green_value, blue_value) {
  return [red_value, green_value, blue_value]
    .map((channel_value) => {
      const hex_value = channel_value.toString(16);

      if (hex_value.length === 1) {
        return `0${hex_value}`;
      }

      return hex_value;
    })
    .join('');
}

/**
 * @param {string} hex_value
 * @param {string} theme_type
 * @returns {string}
 */
function applyHexAlpha(hex_value, theme_type) {
  const rgba_value = hexToRgba(hex_value);

  if (theme_type === 'dark') {
    return rgbToHex(
      Math.floor(rgba_value.r * rgba_value.a),
      Math.floor(rgba_value.g * rgba_value.a),
      Math.floor(rgba_value.b * rgba_value.a),
    );
  }

  return rgbToHex(
    Math.floor(rgba_value.r * rgba_value.a + 255 * (1 - rgba_value.a)),
    Math.floor(rgba_value.g * rgba_value.a + 255 * (1 - rgba_value.a)),
    Math.floor(rgba_value.b * rgba_value.a + 255 * (1 - rgba_value.a)),
  );
}

/**
 * @param {string} hex_value
 * @returns {string}
 */
function normalizeHex(hex_value) {
  const sanitized_hex = hex_value.replace(/^#/u, '');

  if (sanitized_hex.length === 3) {
    return `${sanitized_hex[0]}${sanitized_hex[0]}${sanitized_hex[1]}${sanitized_hex[1]}${sanitized_hex[2]}${sanitized_hex[2]}ff`;
  }

  if (sanitized_hex.length === 4) {
    return `${sanitized_hex[0]}${sanitized_hex[0]}${sanitized_hex[1]}${sanitized_hex[1]}${sanitized_hex[2]}${sanitized_hex[2]}${sanitized_hex[3]}${sanitized_hex[3]}`;
  }

  if (sanitized_hex.length === 6) {
    return `${sanitized_hex}ff`;
  }

  return sanitized_hex.toLowerCase();
}
