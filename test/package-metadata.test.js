import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

import { expect, it } from 'vitest';

import package_json from '../package.json' with { type: 'json' };

/**
 * Package metadata contract coverage.
 *
 * Verifies published files, homepage, engine range, and packed metadata for
 * npm consumers.
 *
 * Kind: support
 * Status: active
 * Tracked in: ../docs/plans/v0/source-anchor-dogfooding.md
 * Decided by: ../docs/decisions/package-metadata.md
 * @patram
 * @see {@link ./package-install-smoke.test.js}
 * @see {@link ../docs/decisions/package-metadata.md}
 */

const exec_file = promisify(execFile);
const repo_directory = dirname(
  fileURLToPath(new URL('../package.json', import.meta.url)),
);

it('defines publish metadata for the npm package', async () => {
  expect(package_json).toMatchObject({
    engines: {
      node: '>=22',
    },
    exports: {
      '.': './lib/patram.js',
      './bin/patram.js': './bin/patram.js',
    },
    files: [
      'bin/patram.js',
      'lib/**/*.js',
      'lib/**/*.ts',
      '!bin/**/*.test.js',
      '!bin/**/*.test-helpers.js',
      '!lib/**/*.test.js',
      '!lib/**/*.test-helpers.js',
    ],
    homepage: 'https://github.com/mantoni/patram',
    license: 'MIT',
    main: './lib/patram.js',
    repository: {
      type: 'git',
      url: 'git+https://github.com/mantoni/patram.git',
    },
  });

  const license_text = await readTextFile(
    new URL('../LICENSE', import.meta.url),
  );

  expect(license_text).toContain('MIT License');
  expect(license_text).toContain(
    'Permission is hereby granted, free of charge',
  );
});

it(
  'excludes test artifacts from the packed npm tarball',
  { tags: ['integration'] },
  async () => {
    const temp_directory = await createTempDirectory();

    try {
      const packed_file_paths = await listPackedFilePaths(temp_directory);

      expect(packed_file_paths).toContain('bin/patram.js');
      expect(packed_file_paths).toContain('lib/patram.js');
      expect(packed_file_paths).toContain('lib/patram-cli.js');
      expect(packed_file_paths).not.toContain('bin/patram.test.js');
      expect(packed_file_paths).not.toContain('bin/patram.test-helpers.js');
      expect(packed_file_paths).not.toContain('lib/build-graph.test.js');
      expect(packed_file_paths).not.toContain('lib/render-output-view.test.js');
    } finally {
      await rm(temp_directory, { force: true, recursive: true });
    }
  },
);

/**
 * Reads a UTF-8 text file.
 *
 * @param {URL} file_url
 * @returns {Promise<string>}
 */
async function readTextFile(file_url) {
  return readFile(file_url, 'utf8');
}

/**
 * Creates a temporary directory for package metadata checks.
 */
async function createTempDirectory() {
  return mkdtemp(join(tmpdir(), 'patram-package-metadata-'));
}

/**
 * @param {string} temp_directory
 */
async function listPackedFilePaths(temp_directory) {
  const { stdout } = await runCommand(
    'npm',
    ['pack', '--dry-run', '--json', '--ignore-scripts'],
    repo_directory,
    {
      npm_config_cache: join(temp_directory, 'npm-cache'),
    },
  );
  /** @type {{ files: Array<{ path: string }> }[]} */
  const pack_results = JSON.parse(stdout);
  /** @type {string[]} */
  const packed_file_paths = pack_results[0].files.map(({ path }) => path);

  return packed_file_paths;
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
