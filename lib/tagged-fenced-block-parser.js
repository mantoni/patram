/**
 * @import {
 *   TaggedFencedBlock,
 *   TaggedFencedBlockFile,
 *   TaggedFencedBlocksInput,
 * } from './tagged-fenced-blocks.types.ts';
 */

import {
  findMarkdownBodyStartLineIndex,
  getMarkdownTitle,
  isClosingMarkdownFence,
  parseHeading,
  parseOpeningMarkdownFence,
  updateHeadingPath,
} from './tagged-fenced-block-markdown.js';
import {
  mergePendingTagSets,
  parseTaggedMetadataLine,
} from './tagged-fenced-block-metadata.js';
import { createTaggedFencedBlockError } from './tagged-fenced-block-error.js';

const BLANK_LINE_PATTERN = /^\s*$/du;

/**
 * @typedef {{ metadata: Record<string, string>, tag_lines: number[] }} PendingTagSet
 */

/**
 * @typedef {{
 *   heading_path: string[];
 *   lang: string;
 *   line_start: number;
 *   metadata: Record<string, string>;
 *   tag_lines: number[];
 *   value_lines: string[];
 * }} OpenTaggedBlock
 */

/**
 * @typedef {{ character: string, lang: string, length: number }} OpenFence
 */

/**
 * @typedef {{
 *   blocks: TaggedFencedBlock[];
 *   body_start: number;
 *   heading_path: string[];
 *   open_fence: OpenFence | null;
 *   open_tagged_block: OpenTaggedBlock | null;
 *   pending_tag_set: PendingTagSet | null;
 *   title: string;
 * }} TaggedBlockScannerState
 */

/**
 * @param {TaggedFencedBlocksInput} input
 * @returns {TaggedFencedBlockFile}
 */
export function extractTaggedFencedBlocksFromSource(input) {
  const lines = input.source_text.split('\n');
  const state = createScannerState(lines);

  for (const [line_index, line] of lines.entries()) {
    if (line_index < state.body_start) {
      continue;
    }

    scanMarkdownLine(input.file_path, state, line, line_index + 1);
  }

  finalizeScannerState(input.file_path, state);

  return {
    blocks: state.blocks,
    path: input.file_path,
    title: state.title,
  };
}

/**
 * @param {string} file_path
 * @param {TaggedBlockScannerState} state
 * @param {string} line
 * @param {number} line_number
 */
function scanMarkdownLine(file_path, state, line, line_number) {
  if (state.open_fence) {
    scanOpenFenceLine(file_path, state, line, line_number);
    return;
  }

  if (tryOpenFence(state, line, line_number)) {
    return;
  }

  if (state.pending_tag_set) {
    scanPendingTagSetLine(file_path, state, line, line_number);
    return;
  }

  const next_tag_set = parseTaggedMetadataLine(file_path, line, line_number);

  if (next_tag_set) {
    state.pending_tag_set = next_tag_set;
    return;
  }

  const heading = parseHeading(line);

  if (heading) {
    state.heading_path = updateHeadingPath(
      state.heading_path,
      state.title,
      heading,
    );
  }
}

/**
 * @param {string} file_path
 * @param {TaggedBlockScannerState} state
 * @param {string} line
 * @param {number} line_number
 */
function scanOpenFenceLine(file_path, state, line, line_number) {
  if (!state.open_fence) {
    return;
  }

  if (isClosingMarkdownFence(line, state.open_fence)) {
    if (state.open_tagged_block) {
      state.blocks.push(
        createTaggedBlock(file_path, line_number, state.open_tagged_block),
      );
    }

    state.open_fence = null;
    state.open_tagged_block = null;
    return;
  }

  if (state.open_tagged_block) {
    state.open_tagged_block.value_lines.push(line);
  }
}

/**
 * @param {TaggedBlockScannerState} state
 * @param {string} line
 * @param {number} line_number
 * @returns {boolean}
 */
function tryOpenFence(state, line, line_number) {
  const open_fence = parseOpeningMarkdownFence(line);

  if (!open_fence) {
    return false;
  }

  state.open_fence = open_fence;
  state.open_tagged_block = createOpenTaggedBlock(
    line_number,
    open_fence.lang,
    state.pending_tag_set,
    state.heading_path,
  );
  state.pending_tag_set = null;

  return true;
}

/**
 * @param {string} file_path
 * @param {TaggedBlockScannerState} state
 * @param {string} line
 * @param {number} line_number
 */
function scanPendingTagSetLine(file_path, state, line, line_number) {
  if (!state.pending_tag_set) {
    return;
  }

  if (BLANK_LINE_PATTERN.test(line)) {
    return;
  }

  const next_tag_set = parseTaggedMetadataLine(file_path, line, line_number);

  if (!next_tag_set) {
    throw createTaggedFencedBlockError(
      'tagged_fenced_blocks.unattached_tag_set',
      `Tagged metadata in "${file_path}" at lines ${state.pending_tag_set.tag_lines.join(', ')} must attach directly to the next fenced block.`,
    );
  }

  state.pending_tag_set = mergePendingTagSets(
    file_path,
    state.pending_tag_set,
    next_tag_set,
  );
}

/**
 * @param {string[]} lines
 * @returns {TaggedBlockScannerState}
 */
function createScannerState(lines) {
  const body_start = findMarkdownBodyStartLineIndex(lines);
  const title = getMarkdownTitle(lines, body_start);

  return {
    blocks: [],
    body_start,
    heading_path: title.length > 0 ? [title] : [],
    open_fence: null,
    open_tagged_block: null,
    pending_tag_set: null,
    title,
  };
}

/**
 * @param {string} file_path
 * @param {TaggedBlockScannerState} state
 */
function finalizeScannerState(file_path, state) {
  if (state.open_tagged_block) {
    throw createTaggedFencedBlockError(
      'tagged_fenced_blocks.unclosed_fence',
      `Unclosed tagged fenced block in "${file_path}" starting at line ${state.open_tagged_block.line_start}.`,
    );
  }

  if (state.pending_tag_set) {
    throw createTaggedFencedBlockError(
      'tagged_fenced_blocks.dangling_tag_set',
      `Dangling tagged metadata in "${file_path}" at lines ${state.pending_tag_set.tag_lines.join(', ')}.`,
    );
  }
}

/**
 * @param {number} line_number
 * @param {string} lang
 * @param {PendingTagSet | null} pending_tag_set
 * @param {string[]} heading_path
 * @returns {OpenTaggedBlock | null}
 */
function createOpenTaggedBlock(
  line_number,
  lang,
  pending_tag_set,
  heading_path,
) {
  if (!pending_tag_set) {
    return null;
  }

  return {
    heading_path: [...heading_path],
    lang,
    line_start: line_number,
    metadata: { ...pending_tag_set.metadata },
    tag_lines: [...pending_tag_set.tag_lines],
    value_lines: [],
  };
}

/**
 * @param {string} file_path
 * @param {number} line_end
 * @param {OpenTaggedBlock} open_tagged_block
 * @returns {TaggedFencedBlock}
 */
function createTaggedBlock(file_path, line_end, open_tagged_block) {
  return {
    context: {
      heading_path: [...open_tagged_block.heading_path],
    },
    id: `block:${file_path}:${open_tagged_block.line_start}`,
    lang: open_tagged_block.lang,
    metadata: { ...open_tagged_block.metadata },
    origin: {
      line_end,
      line_start: open_tagged_block.line_start,
      path: file_path,
      tag_lines: [...open_tagged_block.tag_lines],
    },
    value: open_tagged_block.value_lines.join('\n'),
  };
}
