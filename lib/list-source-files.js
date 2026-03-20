import { glob } from 'node:fs/promises';
import process from 'node:process';

/**
 * List source files matched by Patram include globs.
 *
 * @param {string[]} include_patterns
 * @param {string} [project_directory]
 * @returns {Promise<string[]>}
 */
export async function listSourceFiles(
  include_patterns,
  project_directory = process.cwd(),
) {
  /** @type {Set<string>} */
  const source_file_paths = new Set();

  for (const include_pattern of include_patterns) {
    for await (const matched_path of glob(include_pattern, {
      cwd: project_directory,
    })) {
      source_file_paths.add(normalizeRepoRelativePath(matched_path));
    }
  }

  return [...source_file_paths].sort(comparePaths);
}

/**
 * @param {string} source_path
 * @returns {string}
 */
function normalizeRepoRelativePath(source_path) {
  return source_path.replaceAll('\\', '/');
}

/**
 * @param {string} left_path
 * @param {string} right_path
 * @returns {number}
 */
function comparePaths(left_path, right_path) {
  return left_path.localeCompare(right_path, 'en');
}
