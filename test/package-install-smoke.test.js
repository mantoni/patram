// @module-tag smoke

import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

import { it } from 'vitest';

/**
 * Published package smoke coverage.
 *
 * Packs the repo, installs it in a consumer project, and verifies the
 * published CLI can be imported.
 *
 * Kind: support
 * Status: active
 * Tracked in: ../docs/plans/v0/source-anchor-dogfooding.md
 * Decided by: ../docs/decisions/package-install-smoke-test.md
 * @patram
 * @see {@link ./package-metadata.test.js}
 * @see {@link ../docs/decisions/package-install-smoke-test.md}
 */

const exec_file = promisify(execFile);
const repo_directory = dirname(
  fileURLToPath(new URL('../package.json', import.meta.url)),
);

it('installs and imports the packed npm package in a consumer project', async () => {
  const temp_directory = await createTempDirectory();

  try {
    const tarball_path = await packRepo(temp_directory);
    const consumer_directory = join(temp_directory, 'consumer');

    await createConsumerProject(consumer_directory);
    await installTarball(consumer_directory, tarball_path);
    await importPackedLibrary(consumer_directory);
    await importPackedCli(consumer_directory);
  } finally {
    await rm(temp_directory, { force: true, recursive: true });
  }
});

/**
 * @param {string} parent_directory
 */
async function packRepo(parent_directory) {
  const npm_cache_directory = join(parent_directory, 'npm-cache');

  await mkdir(npm_cache_directory, { recursive: true });

  const { stdout } = await runCommand(
    'npm',
    [
      'pack',
      '--ignore-scripts',
      '--json',
      '--pack-destination',
      parent_directory,
    ],
    repo_directory,
    {
      npm_config_cache: npm_cache_directory,
    },
  );
  const pack_result = JSON.parse(stdout);

  return join(parent_directory, pack_result[0].filename);
}

/**
 * @param {string} consumer_directory
 */
async function createConsumerProject(consumer_directory) {
  await mkdir(consumer_directory, { recursive: true });

  const package_json_path = join(consumer_directory, 'package.json');
  const package_json_text = JSON.stringify(
    {
      name: 'patram-smoke-test-consumer',
      private: true,
      type: 'module',
    },
    null,
    2,
  );

  await writeFile(package_json_path, `${package_json_text}\n`);
}

/**
 * @param {string} consumer_directory
 * @param {string} tarball_path
 */
async function installTarball(consumer_directory, tarball_path) {
  const npm_cache_directory = join(consumer_directory, '.npm-cache');

  await mkdir(npm_cache_directory, { recursive: true });

  await runCommand(
    'npm',
    ['install', '--ignore-scripts', '--no-package-lock', tarball_path],
    consumer_directory,
    {
      npm_config_cache: npm_cache_directory,
    },
  );
}

/**
 * @param {string} consumer_directory
 */
async function importPackedCli(consumer_directory) {
  await runCommand(
    'node',
    [
      '--input-type=module',
      '--eval',
      "await import('./node_modules/patram/bin/patram.js')",
    ],
    consumer_directory,
  );
}

/**
 * @param {string} consumer_directory
 */
async function importPackedLibrary(consumer_directory) {
  await runCommand(
    'node',
    [
      '--input-type=module',
      '--eval',
      [
        "const package_module = await import('patram');",
        "if (typeof package_module.extractTaggedFencedBlocks !== 'function') {",
        "  throw new Error('Expected extractTaggedFencedBlocks export.');",
        '}',
        "if (typeof package_module.loadProjectGraph !== 'function') {",
        "  throw new Error('Expected loadProjectGraph export.');",
        '}',
        "if (typeof package_module.queryGraph !== 'function') {",
        "  throw new Error('Expected queryGraph export.');",
        '}',
      ].join('\n'),
    ],
    consumer_directory,
  );
}

/**
 * Creates a temporary directory for the package smoke test.
 */
async function createTempDirectory() {
  return mkdtemp(join(tmpdir(), 'patram-package-install-'));
}

/**
 * @param {string} command
 * @param {string[]} command_arguments
 * @param {string} working_directory
 * @param {NodeJS.ProcessEnv} [environment]
 */
async function runCommand(
  command,
  command_arguments,
  working_directory,
  environment,
) {
  return exec_file(command, command_arguments, {
    cwd: working_directory,
    env: {
      ...process.env,
      ...environment,
    },
  });
}
