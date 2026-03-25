import { readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, relative, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const script_path = fileURLToPath(import.meta.url);
const repo_directory = resolve(dirname(script_path), '..');
const manifest_path = resolve(repo_directory, '.package-api-declarations.json');
const tsconfig_path = resolve(repo_directory, 'tsconfig.package-types.json');
const typescript_cli_path = resolve(
  repo_directory,
  'node_modules/typescript/bin/tsc',
);

/**
 * Builds package API declaration files and records the emitted paths.
 */
export async function buildPackageApiDeclarations() {
  await cleanPackageApiDeclarations();

  const command_result = spawnSync(
    process.execPath,
    [typescript_cli_path, '-p', tsconfig_path, '--listEmittedFiles'],
    {
      cwd: repo_directory,
      encoding: 'utf8',
    },
  );

  if (command_result.status !== 0) {
    const output = `${command_result.stdout}${command_result.stderr}`.trim();

    throw new Error(output || 'Failed to build package API declarations.');
  }

  const emitted_file_paths = parseEmittedFilePaths(command_result.stdout);

  await writeFile(
    manifest_path,
    `${JSON.stringify({ emitted_file_paths }, null, 2)}\n`,
  );
}

/**
 * Removes generated package API declaration files from the repo.
 */
export async function cleanPackageApiDeclarations() {
  const manifest = await loadManifest();

  if (!manifest) {
    return;
  }

  for (const relative_file_path of manifest.emitted_file_paths) {
    await rm(resolve(repo_directory, relative_file_path), { force: true });
  }

  await rm(manifest_path, { force: true });
}

/**
 * @param {string} stdout
 * @returns {string[]}
 */
function parseEmittedFilePaths(stdout) {
  return stdout
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('TSFILE: '))
    .map((line) => line.slice('TSFILE: '.length))
    .map((file_path) => relative(repo_directory, file_path))
    .sort();
}

/**
 * @returns {Promise<{ emitted_file_paths: string[] } | null>}
 */
async function loadManifest() {
  try {
    const manifest_text = await readFile(manifest_path, 'utf8');

    return JSON.parse(manifest_text);
  } catch (error) {
    if (isMissingFileError(error)) {
      return null;
    }

    throw error;
  }
}

/**
 * @param {unknown} error
 * @returns {error is NodeJS.ErrnoException}
 */
function isMissingFileError(error) {
  return error instanceof Error && 'code' in error && error.code === 'ENOENT';
}
