/**
 * Find the closest candidate above the shared suggestion threshold.
 *
 * @param {string} input_text
 * @param {readonly string[]} candidates
 * @returns {string | undefined}
 */
export function findCloseMatch(input_text, candidates) {
  let best_candidate;
  let best_score = 0;

  for (const candidate of candidates) {
    const score = scoreCandidate(input_text, candidate);

    if (score > best_score) {
      best_candidate = candidate;
      best_score = score;
    }
  }

  if (best_score < 0.6) {
    return undefined;
  }

  return best_candidate;
}

/**
 * @param {string} input_text
 * @param {string} candidate
 * @returns {number}
 */
function scoreCandidate(input_text, candidate) {
  const max_length = Math.max(input_text.length, candidate.length);

  if (max_length === 0) {
    return 1;
  }

  return (
    1 - calculateDamerauLevenshteinDistance(input_text, candidate) / max_length
  );
}

/**
 * @param {string} left_text
 * @param {string} right_text
 * @returns {number}
 */
function calculateDamerauLevenshteinDistance(left_text, right_text) {
  /** @type {number[][]} */
  const matrix = Array.from({ length: left_text.length + 1 }, () =>
    Array.from({ length: right_text.length + 1 }, () => 0),
  );

  for (let left_index = 0; left_index <= left_text.length; left_index += 1) {
    matrix[left_index][0] = left_index;
  }

  for (
    let right_index = 0;
    right_index <= right_text.length;
    right_index += 1
  ) {
    matrix[0][right_index] = right_index;
  }

  for (let left_index = 1; left_index <= left_text.length; left_index += 1) {
    for (
      let right_index = 1;
      right_index <= right_text.length;
      right_index += 1
    ) {
      const substitution_cost =
        left_text[left_index - 1] === right_text[right_index - 1] ? 0 : 1;

      matrix[left_index][right_index] = Math.min(
        matrix[left_index - 1][right_index] + 1,
        matrix[left_index][right_index - 1] + 1,
        matrix[left_index - 1][right_index - 1] + substitution_cost,
      );

      if (
        left_index > 1 &&
        right_index > 1 &&
        left_text[left_index - 1] === right_text[right_index - 2] &&
        left_text[left_index - 2] === right_text[right_index - 1]
      ) {
        matrix[left_index][right_index] = Math.min(
          matrix[left_index][right_index],
          matrix[left_index - 2][right_index - 2] + substitution_cost,
        );
      }
    }
  }

  return matrix[left_text.length][right_text.length];
}
