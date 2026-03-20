import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, expect, it } from 'vitest';

import { listSourceFiles } from './list-source-files.js';

const test_context = createTestContext();

afterEach(async () => {
  await cleanupTestContext(test_context);
});

it('lists matching source files as sorted repo-relative paths', async () => {
  test_context.project_directory = await createTempProjectDirectory();

  await writeProjectFile(test_context.project_directory, 'docs/zeta.md');
  await writeProjectFile(test_context.project_directory, 'docs/alpha.md');
  await writeProjectFile(
    test_context.project_directory,
    'docs/nested/overview.md',
  );
  await writeProjectFile(test_context.project_directory, 'docs/notes.txt');
  await writeProjectFile(test_context.project_directory, 'notes/todo.md');

  const source_files = await listSourceFiles(
    ['docs/**/*.md'],
    test_context.project_directory,
  );

  expect(source_files).toEqual([
    'docs/alpha.md',
    'docs/nested/overview.md',
    'docs/zeta.md',
  ]);
});

it('deduplicates paths matched by multiple include globs', async () => {
  test_context.project_directory = await createTempProjectDirectory();

  await writeProjectFile(test_context.project_directory, 'docs/patram.md');

  const source_files = await listSourceFiles(
    ['docs/**/*.md', 'docs/patram.md'],
    test_context.project_directory,
  );

  expect(source_files).toEqual(['docs/patram.md']);
});

/**
 * Create a temporary project directory.
 *
 * @returns {Promise<string>}
 */
async function createTempProjectDirectory() {
  return mkdtemp(join(tmpdir(), 'patram-list-source-files-'));
}

/**
 * Write a file under the temporary project directory.
 *
 * @param {string} project_directory
 * @param {string} relative_path
 */
async function writeProjectFile(project_directory, relative_path) {
  const file_path = join(project_directory, relative_path);
  const parent_directory = file_path.slice(0, file_path.lastIndexOf('/'));

  await mkdir(parent_directory, { recursive: true });
  await writeFile(file_path, `# ${relative_path}\n`);
}

/**
 * Remove a temporary directory tree.
 *
 * @param {string} project_directory
 */
async function removeDirectory(project_directory) {
  await rm(project_directory, { force: true, recursive: true });
}

/**
 * @returns {{ project_directory: string | null }}
 */
function createTestContext() {
  return {
    project_directory: null,
  };
}

/**
 * @param {{ project_directory: string | null }} test_context
 */
async function cleanupTestContext(test_context) {
  if (test_context.project_directory) {
    await removeDirectory(test_context.project_directory);
    test_context.project_directory = null;
  }
}
