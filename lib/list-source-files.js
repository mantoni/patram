import { globby } from 'globby';
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
  const source_file_paths = await globby(include_patterns, {
    cwd: project_directory,
    expandDirectories: false,
    gitignore: true,
    onlyFiles: true,
  });

  return [...new Set(source_file_paths)].sort(comparePaths);
}

/**
 * @param {string} left_path
 * @param {string} right_path
 * @returns {number}
 */
function comparePaths(left_path, right_path) {
  return left_path.localeCompare(right_path, 'en');
}
