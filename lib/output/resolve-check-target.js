/**
 * @import { PatramDiagnostic } from '../config/load-patram-config.types.ts';
 */
import { access, stat } from 'node:fs/promises';
import { dirname, relative, resolve } from 'node:path';
import process from 'node:process';

const CONFIG_FILE_NAME = '.patram.json';

/**
 * @typedef {(
 *   | { project_directory: string, target_kind: 'project' }
 *   | { project_directory: string, target_kind: 'directory', target_path: string }
 *   | { project_directory: string, target_kind: 'file', target_path: string }
 * )} ResolvedCheckTarget
 */

/**
 * Resolve the project directory and target scope for `check`.
 *
 * @param {string | undefined} target_argument
 * @returns {Promise<ResolvedCheckTarget>}
 */
export async function resolveCheckTarget(target_argument) {
  if (target_argument === undefined) {
    return {
      project_directory: process.cwd(),
      target_kind: 'project',
    };
  }

  const absolute_target_path = resolve(process.cwd(), target_argument);
  const target_stats = await stat(absolute_target_path);
  const target_directory = target_stats.isDirectory()
    ? absolute_target_path
    : dirname(absolute_target_path);
  const project_directory = await findProjectDirectory(target_directory);

  if (target_stats.isFile()) {
    const target_path = normalizeRepoRelativePath(
      relative(project_directory, absolute_target_path),
    );

    return {
      project_directory,
      target_kind: 'file',
      target_path,
    };
  }

  const target_path = normalizeRepoRelativePath(
    relative(project_directory, absolute_target_path),
  );

  if (target_path.length === 0) {
    return {
      project_directory,
      target_kind: 'project',
    };
  }

  return {
    project_directory,
    target_kind: 'directory',
    target_path,
  };
}

/**
 * Select the source files covered by one resolved `check` target.
 *
 * @param {string[]} source_file_paths
 * @param {ResolvedCheckTarget} resolved_target
 * @returns {string[]}
 */
export function selectCheckTargetSourceFiles(
  source_file_paths,
  resolved_target,
) {
  if (resolved_target.target_kind === 'project') {
    return source_file_paths;
  }

  if (resolved_target.target_kind === 'file') {
    return source_file_paths.filter(
      (source_file_path) => source_file_path === resolved_target.target_path,
    );
  }

  return source_file_paths.filter((source_file_path) =>
    isPathInsideDirectory(source_file_path, resolved_target.target_path),
  );
}

/**
 * Filter diagnostics to one resolved `check` target.
 *
 * @param {PatramDiagnostic[]} diagnostics
 * @param {ResolvedCheckTarget} resolved_target
 * @returns {PatramDiagnostic[]}
 */
export function selectCheckTargetDiagnostics(diagnostics, resolved_target) {
  if (resolved_target.target_kind === 'project') {
    return diagnostics;
  }

  if (resolved_target.target_kind === 'file') {
    return diagnostics.filter(
      (diagnostic) => diagnostic.path === resolved_target.target_path,
    );
  }

  return diagnostics.filter((diagnostic) =>
    isPathInsideDirectory(diagnostic.path, resolved_target.target_path),
  );
}

/**
 * @param {string} start_directory
 * @returns {Promise<string>}
 */
async function findProjectDirectory(start_directory) {
  let current_directory = start_directory;

  while (true) {
    if (await hasConfigFile(current_directory)) {
      return current_directory;
    }

    const parent_directory = dirname(current_directory);

    if (parent_directory === current_directory) {
      return start_directory;
    }

    current_directory = parent_directory;
  }
}

/**
 * @param {string} directory_path
 * @returns {Promise<boolean>}
 */
async function hasConfigFile(directory_path) {
  try {
    await access(resolve(directory_path, CONFIG_FILE_NAME));
  } catch (error) {
    if (isMissingPathError(error)) {
      return false;
    }

    throw error;
  }

  return true;
}

/**
 * @param {string} source_path
 * @param {string} directory_path
 * @returns {boolean}
 */
function isPathInsideDirectory(source_path, directory_path) {
  return (
    source_path === directory_path ||
    source_path.startsWith(`${directory_path}/`)
  );
}

/**
 * @param {string} source_path
 * @returns {string}
 */
function normalizeRepoRelativePath(source_path) {
  return source_path.replaceAll('\\', '/');
}

/**
 * @param {unknown} error
 * @returns {error is NodeJS.ErrnoException}
 */
function isMissingPathError(error) {
  if (!(error instanceof Error)) {
    return false;
  }

  return (
    'code' in error && (error.code === 'ENOENT' || error.code === 'ENOTDIR')
  );
}
