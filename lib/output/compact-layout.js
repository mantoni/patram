import wrapAnsi from 'wrap-ansi';

const BODY_INDENT = '  ';
const TITLE_COLUMN_GAP = '  ';

/**
 * @param {{ body_indent?: string, is_tty?: boolean, terminal_width?: number }} layout_options
 * @returns {number}
 */
function getCompactBodyWidth(layout_options = {}) {
  const body_indent = layout_options.body_indent ?? BODY_INDENT;

  if (!hasTtyWidth(layout_options)) {
    return Number.POSITIVE_INFINITY;
  }

  const terminal_width = /** @type {number} */ (layout_options.terminal_width);

  return Math.max(1, terminal_width - body_indent.length);
}

/**
 * @param {string[]} left_titles
 * @returns {number}
 */
export function getCompactLeftTitleWidth(left_titles) {
  if (left_titles.length === 0) {
    return 0;
  }

  return Math.max(...left_titles.map((left_title) => left_title.length));
}

/**
 * @param {string[]} metadata_rows
 * @returns {string | undefined}
 */
export function formatCompactMetadataLabel(metadata_rows) {
  if (metadata_rows.length === 0) {
    return undefined;
  }

  return `[${metadata_rows.join('  ')}]`;
}

/**
 * @param {{
 *   format_left?: (text: string) => string,
 *   format_right?: (text: string) => string,
 *   is_tty?: boolean,
 *   left_title: string,
 *   left_title_width: number,
 *   right_title?: string,
 *   terminal_width?: number,
 * }} options
 * @returns {string}
 */
export function formatCompactTitleRow(options) {
  const formatLeft = options.format_left ?? identity;
  const formatRight = options.format_right ?? identity;

  if (!options.right_title) {
    return formatLeft(options.left_title);
  }

  if (!hasTtyWidth(options)) {
    return `${formatLeft(options.left_title)}${TITLE_COLUMN_GAP}${formatRight(options.right_title)}`;
  }

  const terminal_width = /** @type {number} */ (options.terminal_width);
  const available_width =
    terminal_width - options.left_title.length - TITLE_COLUMN_GAP.length;

  if (available_width <= 0) {
    return formatLeft(options.left_title);
  }

  return `${formatLeft(options.left_title)}${TITLE_COLUMN_GAP}${formatRight(truncateText(options.right_title, available_width))}`;
}

/**
 * @param {string} text
 * @param {{ body_indent?: string, is_tty?: boolean, terminal_width?: number }} layout_options
 * @returns {string[]}
 */
export function wrapCompactBodyText(text, layout_options = {}) {
  if (!hasTtyWidth(layout_options)) {
    return text.split('\n');
  }

  const body_width = getCompactBodyWidth(layout_options);
  /** @type {string[]} */
  const lines = [];

  for (const [line_index, source_line] of text.split('\n').entries()) {
    if (line_index > 0 && source_line.length === 0) {
      lines.push('');
      continue;
    }

    const wrapped_line = wrapAnsi(source_line, body_width, {
      hard: false,
      trim: false,
      wordWrap: true,
    });

    lines.push(...wrapped_line.split('\n'));
  }

  return lines;
}

/**
 * @param {{ is_tty?: boolean, terminal_width?: number }} layout_options
 * @returns {boolean}
 */
function hasTtyWidth(layout_options) {
  return (
    layout_options.is_tty === true &&
    typeof layout_options.terminal_width === 'number' &&
    Number.isFinite(layout_options.terminal_width) &&
    layout_options.terminal_width > 0
  );
}

/**
 * @param {string} value
 * @param {number} max_width
 * @returns {string}
 */
function truncateText(value, max_width) {
  if (value.length <= max_width) {
    return value;
  }

  if (max_width <= 1) {
    return '…';
  }

  if (value.startsWith('[') && value.endsWith(']')) {
    return truncateBracketedText(value, max_width);
  }

  return `${value.slice(0, max_width - 1)}…`;
}

/**
 * @param {string} value
 * @param {number} max_width
 * @returns {string}
 */
function truncateBracketedText(value, max_width) {
  if (max_width === 2) {
    return '…]';
  }

  if (max_width === 3) {
    return '[…]';
  }

  const inner_value = value.slice(1, -1);
  const prefix_width = Math.max(0, max_width - 3);

  return `[${inner_value.slice(0, prefix_width)}…]`;
}

/**
 * @param {string} value
 * @returns {string}
 */
function identity(value) {
  return value;
}
