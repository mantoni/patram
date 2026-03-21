export const SUPPORTED_SOURCE_FILE_EXTENSIONS = ['.md', '.markdown'];

export const DEFAULT_INCLUDE_PATTERNS =
  SUPPORTED_SOURCE_FILE_EXTENSIONS.map(createIncludePattern);

/**
 * @param {string} file_extension
 * @returns {string}
 */
function createIncludePattern(file_extension) {
  return `**/*${file_extension}`;
}
