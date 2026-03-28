import { createTaggedFencedBlockError } from './tagged-fenced-block-error.js';

const TAGGED_METADATA_LINE_PATTERN = /^\[patram\s+(.+)\]:\s*#\s*$/du;
const TAGGED_METADATA_PAIR_PATTERN = /^([a-z][a-z0-9_]*)=([^\s]+)$/du;

/**
 * @param {string} file_path
 * @param {{ metadata: Record<string, string>, tag_lines: number[] }} pending_tag_set
 * @param {{ metadata: Record<string, string>, tag_lines: number[] }} next_tag_set
 * @returns {{ metadata: Record<string, string>, tag_lines: number[] }}
 */
export function mergePendingTagSets(file_path, pending_tag_set, next_tag_set) {
  /** @type {Record<string, string>} */
  const metadata = { ...pending_tag_set.metadata };

  for (const [key, value] of Object.entries(next_tag_set.metadata)) {
    if (metadata[key] !== undefined) {
      throw createTaggedFencedBlockError(
        'tagged_fenced_blocks.duplicate_metadata_key',
        `Duplicate tagged metadata key "${key}" in "${file_path}" at line ${next_tag_set.tag_lines[0]}.`,
      );
    }

    metadata[key] = value;
  }

  return {
    metadata,
    tag_lines: [...pending_tag_set.tag_lines, ...next_tag_set.tag_lines],
  };
}

/**
 * @param {string} file_path
 * @param {string} line
 * @param {number} line_number
 * @returns {{ metadata: Record<string, string>, tag_lines: number[] } | null}
 */
export function parseTaggedMetadataLine(file_path, line, line_number) {
  const trimmed_line = line.trim();

  if (!trimmed_line.startsWith('[patram')) {
    return null;
  }

  const metadata_match = trimmed_line.match(TAGGED_METADATA_LINE_PATTERN);

  if (!metadata_match) {
    throw createTaggedFencedBlockError(
      'tagged_fenced_blocks.invalid_tag_line',
      `Invalid tagged metadata line in "${file_path}" at line ${line_number}.`,
    );
  }

  return {
    metadata: parseTaggedMetadataPairs(
      file_path,
      metadata_match[1],
      line_number,
    ),
    tag_lines: [line_number],
  };
}

/**
 * @param {string} file_path
 * @param {string} pair_text
 * @param {number} line_number
 * @returns {Record<string, string>}
 */
function parseTaggedMetadataPairs(file_path, pair_text, line_number) {
  const tokens = pair_text.split(/\s+/du);
  /** @type {Record<string, string>} */
  const metadata = {};

  for (const token of tokens) {
    const pair_match = token.match(TAGGED_METADATA_PAIR_PATTERN);

    if (!pair_match) {
      throw createTaggedFencedBlockError(
        'tagged_fenced_blocks.invalid_tag_line',
        `Invalid tagged metadata line in "${file_path}" at line ${line_number}.`,
      );
    }

    if (metadata[pair_match[1]] !== undefined) {
      throw createTaggedFencedBlockError(
        'tagged_fenced_blocks.duplicate_metadata_key',
        `Duplicate tagged metadata key "${pair_match[1]}" in "${file_path}" at line ${line_number}.`,
      );
    }

    metadata[pair_match[1]] = pair_match[2];
  }

  return metadata;
}
