/**
 * @import { TaggedFencedBlockError } from './tagged-fenced-blocks.types.ts';
 */

/**
 * @param {string} code
 * @param {string} message
 * @returns {TaggedFencedBlockError}
 */
export function createTaggedFencedBlockError(code, message) {
  const error = /** @type {TaggedFencedBlockError} */ (new Error(message));

  error.code = code;
  error.name = 'TaggedFencedBlockError';

  return error;
}
