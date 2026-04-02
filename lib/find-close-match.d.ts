/**
 * Find the closest candidate above the shared suggestion threshold.
 *
 * @param {string} input_text
 * @param {readonly string[]} candidates
 * @returns {string | undefined}
 */
export function findCloseMatch(
  input_text: string,
  candidates: readonly string[],
): string | undefined;
