import process from 'node:process';

import { listMatchingFiles } from './list-repo-files.js';
/**
 * Source file scanning.
 *
 * Expands include globs into stable repo-relative file lists for indexing and
 * broken-link validation.
 *
 * kind: scan
 * status: active
 * tracked_in: ../../docs/plans/v0/source-anchor-dogfooding.md
 * decided_by: ../../docs/decisions/source-scan.md
 * @patram
 * @see {@link ../graph/load-project-graph.js}
 * @see {@link ../../docs/decisions/source-scan.md}
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
 * @param {string} left_path
 * @param {string} right_path
 * @returns {number}
 */
function comparePaths(left_path, right_path) {
  return left_path.localeCompare(right_path, 'en');
}
