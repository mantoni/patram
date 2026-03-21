import { globby } from 'globby';
import process from 'node:process';

/**
 * Source file scanning.
 *
 * Expands include globs into stable repo-relative file lists for indexing and
 * broken-link validation.
 *
 * Kind: scan
 * Status: active
 * Tracked in: ../docs/plans/v0/source-anchor-dogfooding.md
 * Decided by: ../docs/decisions/source-scan.md
 * @patram
 * @see {@link ./load-project-graph.js}
 * @see {@link ../docs/decisions/source-scan.md}
 */

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
  const source_file_paths = await listMatchingFiles(
    include_patterns,
    project_directory,
  );

  return [...new Set(source_file_paths)].sort(comparePaths);
}

/**
 * List repo files available for broken-link validation.
 *
 * @param {string} [project_directory]
 * @returns {Promise<string[]>}
 */
export async function listRepoFiles(project_directory = process.cwd()) {
  const repo_file_paths = await listMatchingFiles(['**/*'], project_directory, {
    dot: true,
  });

  return [...new Set(repo_file_paths)].sort(comparePaths);
}

/**
 * @param {string[]} include_patterns
 * @param {string} project_directory
 * @param {{ dot?: boolean }} [options]
 * @returns {Promise<string[]>}
 */
async function listMatchingFiles(
  include_patterns,
  project_directory,
  options = {},
) {
  return globby(include_patterns, {
    cwd: project_directory,
    dot: options.dot ?? false,
    expandDirectories: false,
    gitignore: true,
    onlyFiles: true,
  });
}

/**
 * @param {string} left_path
 * @param {string} right_path
 * @returns {number}
 */
function comparePaths(left_path, right_path) {
  return left_path.localeCompare(right_path, 'en');
}
