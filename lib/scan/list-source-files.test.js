import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import process from 'node:process';

import { afterEach, expect, it } from 'vitest';

import { listRepoFiles } from './list-repo-files.js';
import { listSourceFiles } from './list-source-files.js';
import {
  DEFAULT_INCLUDE_PATTERNS,
  YAML_SOURCE_FILE_EXTENSIONS,
} from '../config/source-file-defaults.js';

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

it('applies root .gitignore exclusions automatically', async () => {
  test_context.project_directory = await createTempProjectDirectory();

  await writeProjectFile(test_context.project_directory, 'docs/keep.md');
  await writeProjectFile(test_context.project_directory, 'docs/ignored.md');
  await writeProjectFile(test_context.project_directory, 'generated/output.md');
  await writeProjectFile(
    test_context.project_directory,
    '.gitignore',
    ['docs/ignored.md', 'generated/'].join('\n'),
  );

  const source_files = await listSourceFiles(
    ['**/*.md'],
    test_context.project_directory,
  );

  expect(source_files).toEqual(['docs/keep.md']);
});

it('applies nested .gitignore rules and negations in their subtree', async () => {
  test_context.project_directory = await createTempProjectDirectory();

  await writeProjectFile(test_context.project_directory, 'docs/guide.md');
  await writeProjectFile(test_context.project_directory, 'docs/drafts/keep.md');
  await writeProjectFile(test_context.project_directory, 'docs/drafts/skip.md');
  await writeProjectFile(
    test_context.project_directory,
    'docs/drafts/.gitignore',
    ['*.md', '!keep.md'].join('\n'),
  );

  const source_files = await listSourceFiles(
    ['**/*.md'],
    test_context.project_directory,
  );

  expect(source_files).toEqual(['docs/drafts/keep.md', 'docs/guide.md']);
});

it('keeps root-anchored .gitignore rules scoped to the root path', async () => {
  test_context.project_directory = await createTempProjectDirectory();

  await writeProjectFile(test_context.project_directory, 'dist/root.md');
  await writeProjectFile(test_context.project_directory, 'src/dist/nested.md');
  await writeProjectFile(
    test_context.project_directory,
    '.gitignore',
    '/dist\n',
  );

  const source_files = await listSourceFiles(
    ['**/*.md'],
    test_context.project_directory,
  );

  expect(source_files).toEqual(['src/dist/nested.md']);
});

it('lists repo files for link validation across indexed and dot paths', async () => {
  test_context.project_directory = await createTempProjectDirectory();

  await writeProjectFile(
    test_context.project_directory,
    '.github/workflows/checks.yml',
    'name: checks\n',
  );
  await writeProjectFile(test_context.project_directory, 'src/index.js', '');
  await writeProjectFile(
    test_context.project_directory,
    'ignored/output.js',
    '',
  );
  await writeProjectFile(
    test_context.project_directory,
    '.gitignore',
    'ignored/\n',
  );

  const repo_files = await listRepoFiles(test_context.project_directory);

  expect(repo_files).toEqual([
    '.github/workflows/checks.yml',
    '.gitignore',
    'src/index.js',
  ]);
});

it('uses the current working directory when no project directory is provided', async () => {
  test_context.project_directory = await createTempProjectDirectory();

  await writeProjectFile(test_context.project_directory, 'docs/guide.md');
  await writeProjectFile(test_context.project_directory, 'docs/draft.md');
  await writeProjectFile(
    test_context.project_directory,
    '.hidden/config.json',
    '',
  );
  await writeProjectFile(
    test_context.project_directory,
    '.gitignore',
    'docs/draft.md\n',
  );

  const original_working_directory = process.cwd();

  process.chdir(test_context.project_directory);

  try {
    await expect(listSourceFiles(['**/*.md'])).resolves.toEqual([
      'docs/guide.md',
    ]);
    await expect(listRepoFiles()).resolves.toEqual([
      '.gitignore',
      '.hidden/config.json',
      'docs/guide.md',
    ]);
  } finally {
    process.chdir(original_working_directory);
  }
});

it('includes YAML files in the default source extension sweep', () => {
  expect(YAML_SOURCE_FILE_EXTENSIONS).toContain('.yaml');
  expect(YAML_SOURCE_FILE_EXTENSIONS).toContain('.yml');
  expect(DEFAULT_INCLUDE_PATTERNS).toContain('**/*.yaml');
  expect(DEFAULT_INCLUDE_PATTERNS).toContain('**/*.yml');
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
 * @param {string} [source_text]
 */
async function writeProjectFile(project_directory, relative_path, source_text) {
  const file_path = join(project_directory, relative_path);
  const parent_directory = file_path.slice(0, file_path.lastIndexOf('/'));

  await mkdir(parent_directory, { recursive: true });
  await writeFile(file_path, source_text ?? `# ${relative_path}\n`);
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
