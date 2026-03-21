/**
 * @typedef {import('./parse-cli-arguments-helpers.js').CliOptionToken} CliOptionToken
 * @typedef {import('./parse-cli-arguments.types.ts').CliColorMode} CliColorMode
 */

const VALID_COLOR_MODES = new Set(['auto', 'always', 'never']);

/**
 * @param {CliOptionToken[]} option_tokens
 * @returns {CliColorMode}
 */
export function resolveColorMode(option_tokens) {
  let color_mode = 'auto';

  for (const token of option_tokens) {
    if (token.name === 'no-color') {
      color_mode = 'never';
    }

    if (token.name === 'color' && typeof token.value === 'string') {
      color_mode = token.value;
    }
  }

  return /** @type {CliColorMode} */ (color_mode);
}

/**
 * @param {CliOptionToken[]} option_tokens
 * @returns {string | null}
 */
export function findInvalidColorMode(option_tokens) {
  for (const token of option_tokens) {
    if (
      token.name === 'color' &&
      typeof token.value === 'string' &&
      !VALID_COLOR_MODES.has(token.value)
    ) {
      return 'Color must be one of "auto", "always", or "never".';
    }
  }

  return null;
}
