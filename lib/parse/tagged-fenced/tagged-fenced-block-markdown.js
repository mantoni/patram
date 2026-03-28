const FRONT_MATTER_BOUNDARY_PATTERN = /^---$/du;
const HEADING_PATTERN = /^(#{1,6})\s+(.+?)(?:\s+#+\s*)?$/du;
const MARKDOWN_FENCE_PATTERN = /^([`~]{3,})(.*)$/du;

/**
 * @param {string[]} lines
 * @returns {number}
 */
export function findMarkdownBodyStartLineIndex(lines) {
  if (lines[0] !== '---') {
    return 0;
  }

  for (let line_index = 1; line_index < lines.length; line_index += 1) {
    if (FRONT_MATTER_BOUNDARY_PATTERN.test(lines[line_index])) {
      return line_index + 1;
    }
  }

  return 0;
}

/**
 * @param {string[]} lines
 * @param {number} body_start
 * @returns {string}
 */
export function getMarkdownTitle(lines, body_start) {
  const title_line = lines[body_start];

  if (title_line === undefined) {
    return '';
  }

  const trimmed_line = title_line.trim();

  if (trimmed_line.length === 0) {
    return '';
  }

  return parseHeading(trimmed_line)?.text ?? trimmed_line;
}

/**
 * @param {string} line
 * @returns {{ level: number, text: string } | null}
 */
export function parseHeading(line) {
  const heading_match = line.trim().match(HEADING_PATTERN);

  if (!heading_match) {
    return null;
  }

  return {
    level: heading_match[1].length,
    text: heading_match[2].trim(),
  };
}

/**
 * @param {string[]} heading_path
 * @param {string} title
 * @param {{ level: number, text: string }} heading
 * @returns {string[]}
 */
export function updateHeadingPath(heading_path, title, heading) {
  if (heading.level === 1) {
    return [heading.text];
  }

  const next_heading_path = heading_path.slice(0, heading.level - 1);

  if (next_heading_path.length === 0 && title.length > 0) {
    next_heading_path.push(title);
  }

  next_heading_path.push(heading.text);

  return next_heading_path;
}

/**
 * @param {string} line
 * @returns {{ character: string, lang: string, length: number } | null}
 */
export function parseOpeningMarkdownFence(line) {
  const trimmed_line = line.trimStart();
  const fence_match = trimmed_line.match(MARKDOWN_FENCE_PATTERN);

  if (!fence_match) {
    return null;
  }

  return {
    character: fence_match[1][0],
    lang: fence_match[2].trim(),
    length: fence_match[1].length,
  };
}

/**
 * @param {string} line
 * @param {{ character: string, length: number }} open_fence
 * @returns {boolean}
 */
export function isClosingMarkdownFence(line, open_fence) {
  return line
    .trimStart()
    .startsWith(open_fence.character.repeat(open_fence.length));
}
