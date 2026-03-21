export const MARKDOWN_SOURCE_FILE_EXTENSIONS = ['.markdown', '.md'];

export const JSDOC_SOURCE_FILE_EXTENSIONS = [
  '.cjs',
  '.cts',
  '.js',
  '.jsx',
  '.mjs',
  '.mts',
  '.ts',
  '.tsx',
];

export const SUPPORTED_SOURCE_FILE_EXTENSIONS = [
  ...JSDOC_SOURCE_FILE_EXTENSIONS,
  ...MARKDOWN_SOURCE_FILE_EXTENSIONS,
];

export const DEFAULT_INCLUDE_PATTERNS =
  SUPPORTED_SOURCE_FILE_EXTENSIONS.map(createIncludePattern);

/**
 * @param {string} file_extension
 * @returns {string}
 */
function createIncludePattern(file_extension) {
  return `**/*${file_extension}`;
}
