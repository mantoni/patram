import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

import { afterEach, expect, it } from 'vitest';

import { main } from './patram-cli.js';

const test_context = createTestContext();

afterEach(async () => {
  await cleanupTestContext(test_context);
});

it('runs the fields command without requiring repo config', async () => {
  test_context.project_directory = await createTempProjectDirectory();
  await seedFieldsProject(test_context.project_directory);

  process.chdir(test_context.project_directory);

  /** @type {string[]} */
  const stderr_chunks = [];
  /** @type {string[]} */
  const stdout_chunks = [];
  const exit_code = await main(['fields', '--json'], {
    stderr: {
      write(chunk) {
        stderr_chunks.push(chunk);
        return true;
      },
    },
    stdout: {
      isTTY: false,
      write(chunk) {
        stdout_chunks.push(chunk);
        return true;
      },
    },
  });

  expect(exit_code).toBe(0);
  expect(stderr_chunks).toEqual([]);
  expect(JSON.parse(stdout_chunks.join(''))).toEqual(
    expect.objectContaining({
      fields: expect.arrayContaining([
        expect.objectContaining({
          name: 'status',
          likely_type: expect.objectContaining({
            name: 'enum',
          }),
        }),
      ]),
    }),
  );
});

/**
 * @returns {{ original_working_directory: string, project_directory: string | null }}
 */
function createTestContext() {
  return {
    original_working_directory: process.cwd(),
    project_directory: null,
  };
}

/**
 * @returns {Promise<string>}
 */
async function createTempProjectDirectory() {
  return mkdtemp(join(tmpdir(), 'patram-fields-cli-'));
}

/**
 * @param {string} project_directory
 * @param {string} relative_path
 * @param {string} file_contents
 * @returns {Promise<void>}
 */
async function writeProjectFile(
  project_directory,
  relative_path,
  file_contents,
) {
  const file_path = join(project_directory, relative_path);
  await mkdir(dirname(file_path), { recursive: true });
  await writeFile(file_path, file_contents, 'utf8');
}

/**
 * @param {string} project_directory
 * @returns {Promise<void>}
 */
async function seedFieldsProject(project_directory) {
  await writeProjectFile(
    project_directory,
    'docs/tasks/alpha.md',
    ['# Alpha Task', '', '- Kind: task', '- Status: pending'].join('\n'),
  );
}

/**
 * @param {{ original_working_directory: string, project_directory: string | null }} test_context
 * @returns {Promise<void>}
 */
async function cleanupTestContext(test_context) {
  process.chdir(test_context.original_working_directory);

  if (test_context.project_directory) {
    await rm(test_context.project_directory, { recursive: true, force: true });
    test_context.project_directory = null;
  }
}
