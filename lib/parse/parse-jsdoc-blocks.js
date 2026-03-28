/**
 * Collect JSDoc blocks and their activated `@patram` markers.
 *
 * @param {string} source_text
 * @returns {Array<{ activation_column: number | null, activation_line: number | null, lines: Array<{ column: number, content: string, line: number }> }>}
 */
export function collectJsdocBlocks(source_text) {
  const source_lines = source_text.split('\n');
  /** @type {Array<{ activation_column: number | null, activation_line: number | null, lines: Array<{ column: number, content: string, line: number }> }>} */
  const jsdoc_blocks = [];

  for (let line_index = 0; line_index < source_lines.length; line_index += 1) {
    if (!source_lines[line_index].includes('/**')) {
      continue;
    }

    const closing_line_index = findJsdocClosingLineIndex(
      source_lines,
      line_index,
    );

    if (closing_line_index < 0) {
      break;
    }

    const block_lines = source_lines
      .slice(line_index, closing_line_index + 1)
      .map((raw_line, block_line_index) =>
        createJsdocBlockLine(
          raw_line,
          line_index + block_line_index + 1,
          block_line_index === 0,
          line_index + block_line_index === closing_line_index,
        ),
      );
    const activation_line = block_lines.find((block_line) =>
      /^@patram(?:\s|$)/du.test(block_line.content),
    );

    jsdoc_blocks.push({
      activation_column: activation_line?.column ?? null,
      activation_line: activation_line?.line ?? null,
      lines: block_lines,
    });
    line_index = closing_line_index;
  }

  return jsdoc_blocks;
}

/**
 * @param {string[]} source_lines
 * @param {number} start_line_index
 * @returns {number}
 */
function findJsdocClosingLineIndex(source_lines, start_line_index) {
  for (
    let line_index = start_line_index;
    line_index < source_lines.length;
    line_index += 1
  ) {
    const source_line = source_lines[line_index];
    const search_start =
      line_index === start_line_index ? source_line.indexOf('/**') + 3 : 0;

    if (source_line.indexOf('*/', search_start) >= 0) {
      return line_index;
    }
  }

  return -1;
}

/**
 * @param {string} raw_line
 * @param {number} line_number
 * @param {boolean} is_first_line
 * @param {boolean} is_last_line
 * @returns {{ column: number, content: string, line: number }}
 */
function createJsdocBlockLine(
  raw_line,
  line_number,
  is_first_line,
  is_last_line,
) {
  if (isLastClosingLine(raw_line, is_first_line, is_last_line)) {
    return {
      column: raw_line.indexOf('*/') + 1,
      content: '',
      line: line_number,
    };
  }

  const line_parts = is_first_line
    ? extractFirstJsdocLineContent(raw_line, is_last_line)
    : extractFollowingJsdocLineContent(raw_line, is_last_line);

  return {
    column: line_parts.column,
    content: line_parts.content.trim(),
    line: line_number,
  };
}

/**
 * @param {string} raw_line
 * @param {boolean} is_first_line
 * @param {boolean} is_last_line
 * @returns {boolean}
 */
function isLastClosingLine(raw_line, is_first_line, is_last_line) {
  return is_last_line && !is_first_line && /^\s*\*\/\s*$/du.test(raw_line);
}

/**
 * @param {string} raw_line
 * @param {boolean} is_last_line
 * @returns {{ column: number, content: string }}
 */
function extractFirstJsdocLineContent(raw_line, is_last_line) {
  const start_index = raw_line.indexOf('/**');
  let line_content = raw_line.slice(start_index + 3);
  let column = start_index + 4;

  if (line_content.startsWith(' ')) {
    line_content = line_content.slice(1);
    column += 1;
  }

  return finalizeJsdocLineContent(line_content, column, is_last_line);
}

/**
 * @param {string} raw_line
 * @param {boolean} is_last_line
 * @returns {{ column: number, content: string }}
 */
function extractFollowingJsdocLineContent(raw_line, is_last_line) {
  const prefix_match = raw_line.match(/^\s*\*\s?/du);
  const prefix_length = prefix_match ? prefix_match[0].length : 0;
  const line_content = raw_line.slice(prefix_length);

  return finalizeJsdocLineContent(
    line_content,
    prefix_length + 1,
    is_last_line,
  );
}

/**
 * @param {string} line_content
 * @param {number} column
 * @param {boolean} is_last_line
 * @returns {{ column: number, content: string }}
 */
function finalizeJsdocLineContent(line_content, column, is_last_line) {
  const trimmed_line_content = is_last_line
    ? removeJsdocClosingDelimiter(line_content)
    : line_content;
  const leading_whitespace_match = trimmed_line_content.match(/^\s*/du);
  const leading_whitespace_length = leading_whitespace_match
    ? leading_whitespace_match[0].length
    : 0;

  return {
    column: column + leading_whitespace_length,
    content: trimmed_line_content,
  };
}

/**
 * @param {string} line_content
 * @returns {string}
 */
function removeJsdocClosingDelimiter(line_content) {
  const closing_index = line_content.indexOf('*/');

  if (closing_index < 0) {
    return line_content;
  }

  return line_content.slice(0, closing_index);
}
