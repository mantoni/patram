/**
 * @import {
 *   TaggedFencedBlock,
 *   TaggedFencedBlockCriteria,
 *   TaggedFencedBlockFile,
 *   TaggedFencedBlocksInput,
 * } from './tagged-fenced-blocks.types.ts';
 */

import { readFile } from 'node:fs/promises';

import { createTaggedFencedBlockError } from './tagged-fenced-block-error.js';
import { extractTaggedFencedBlocksFromSource } from './tagged-fenced-block-parser.js';

/**
 * Tagged fenced block public API.
 *
 * Loads or extracts one markdown file worth of tagged fenced blocks and
 * provides exact-match selection helpers.
 *
 * Kind: parse
 * Status: active
 * Tracked in: ../../docs/plans/v0/tagged-fenced-block-extraction.md
 * Decided by: ../../docs/decisions/tagged-fenced-block-extraction.md
 * @patram
 * @see {@link ../../docs/decisions/tagged-fenced-block-extraction.md}
 */

/**
 * @param {TaggedFencedBlocksInput} input
 * @returns {TaggedFencedBlockFile}
 */
export function extractTaggedFencedBlocks(input) {
  return extractTaggedFencedBlocksFromSource(input);
}

/**
 * @param {string} file_path
 * @returns {Promise<TaggedFencedBlockFile>}
 */
export async function loadTaggedFencedBlocks(file_path) {
  const source_text = await readFile(file_path, 'utf8');

  return extractTaggedFencedBlocks({
    file_path,
    source_text,
  });
}

/**
 * @param {TaggedFencedBlock[]} blocks
 * @param {TaggedFencedBlockCriteria} criteria
 * @returns {TaggedFencedBlock[]}
 */
export function selectTaggedBlocks(blocks, criteria) {
  const criteria_entries = Object.entries(criteria);

  return blocks.filter((block) =>
    criteria_entries.every(
      ([key, value]) =>
        block.metadata[key] !== undefined && block.metadata[key] === value,
    ),
  );
}

/**
 * @param {TaggedFencedBlock[]} blocks
 * @param {TaggedFencedBlockCriteria} criteria
 * @returns {TaggedFencedBlock}
 */
export function selectTaggedBlock(blocks, criteria) {
  const matches = selectTaggedBlocks(blocks, criteria);

  if (matches.length === 1) {
    return matches[0];
  }

  if (matches.length === 0) {
    throw createTaggedFencedBlockError(
      'tagged_fenced_blocks.not_found',
      `No tagged fenced block matches ${formatSelectionCriteria(criteria)}.`,
    );
  }

  throw createTaggedFencedBlockError(
    'tagged_fenced_blocks.not_unique',
    `Multiple tagged fenced blocks match ${formatSelectionCriteria(criteria)}.`,
  );
}

/**
 * @param {TaggedFencedBlockCriteria} criteria
 * @returns {string}
 */
function formatSelectionCriteria(criteria) {
  return Object.entries(criteria)
    .sort(([left_key], [right_key]) => left_key.localeCompare(right_key))
    .map(([key, value]) => `${key}=${value}`)
    .join(', ');
}
