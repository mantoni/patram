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
async function resolveCheckTarget(target_argument) {
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
 * @param {string[]} target_arguments
 * @returns {Promise<ResolvedCheckTarget[]>}
 */
export async function resolveCheckTargets(target_arguments) {
  if (target_arguments.length === 0) {
    return [await resolveCheckTarget(undefined)];
  }

  return Promise.all(
    target_arguments.map((target_argument) =>
      resolveCheckTarget(target_argument),
    ),
  );
}
/** @param {ResolvedCheckTarget[]} resolved_targets
 * @returns {string | null}
 */
export function resolveCheckTargetProjectDirectory(resolved_targets) {
  const project_directory = resolved_targets[0]?.project_directory;
  if (!project_directory) {
    return null;
  }
  for (const resolved_target of resolved_targets) {
    if (resolved_target.project_directory !== project_directory) {
      return null;
    }
  }
  return project_directory;
}
/**
 * Select the source files covered by one resolved `check` target.
 *
 * @param {string[]} source_file_paths
 * @param {ResolvedCheckTarget} resolved_target
 * @returns {string[]}
 */
function selectCheckTargetSourceFiles(source_file_paths, resolved_target) {
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
 * @param {string[]} source_file_paths
 * @param {ResolvedCheckTarget[]} resolved_targets
 * @returns {string[]}
 */
export function selectCheckTargetsSourceFiles(
  source_file_paths,
  resolved_targets,
) {
  return selectCheckTargetValues(
    source_file_paths,
    resolved_targets,
    selectCheckTargetSourceFiles,
    (source_file_path) => source_file_path,
  );
}
/**
 * Filter diagnostics to one resolved `check` target.
 *
 * @param {PatramDiagnostic[]} diagnostics
 * @param {ResolvedCheckTarget} resolved_target
 * @returns {PatramDiagnostic[]}
 */
function selectCheckTargetDiagnostics(diagnostics, resolved_target) {
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
 * @param {PatramDiagnostic[]} diagnostics
 * @param {ResolvedCheckTarget[]} resolved_targets
 * @returns {PatramDiagnostic[]}
 */
export function selectCheckTargetsDiagnostics(diagnostics, resolved_targets) {
  return selectCheckTargetValues(
    diagnostics,
    resolved_targets,
    selectCheckTargetDiagnostics,
    createDiagnosticKey,
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
 * @template ValueType
 * @param {ValueType[]} values
 * @param {ResolvedCheckTarget[]} resolved_targets
 * @param {(values: ValueType[], resolved_target: ResolvedCheckTarget) => ValueType[]} select_values
 * @param {(value: ValueType) => string} get_value_key
 * @returns {ValueType[]}
 */
function selectCheckTargetValues(
  values,
  resolved_targets,
  select_values,
  get_value_key,
) {
  if (
    resolved_targets.some(
      (resolved_target) => resolved_target.target_kind === 'project',
    )
  ) {
    return values;
  }

  /** @type {Set<string>} */
  const selected_keys = new Set();
  /** @type {ValueType[]} */
  const selected_values = [];

  for (const resolved_target of resolved_targets) {
    for (const value of select_values(values, resolved_target)) {
      const value_key = get_value_key(value);

      if (selected_keys.has(value_key)) {
        continue;
      }

      selected_keys.add(value_key);
      selected_values.push(value);
    }
  }

  return selected_values;
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
 * @param {PatramDiagnostic} diagnostic
 * @returns {string}
 */
function createDiagnosticKey(diagnostic) {
  return [
    diagnostic.path,
    diagnostic.line,
    diagnostic.column,
    diagnostic.level,
    diagnostic.code,
    diagnostic.message,
  ].join(':');
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
