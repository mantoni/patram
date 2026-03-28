/** @import * as $k$$l$load$j$patram$j$config$k$types$k$ts from '../config/load-patram-config.types.ts'; */
import { mkdir, mkdtemp, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import process from 'node:process';

import { afterEach, expect, it } from 'vitest';

import {
  resolveCheckTarget,
  selectCheckTargetDiagnostics,
  selectCheckTargetSourceFiles,
} from './resolve-check-target.js';

/** @type {string | null} */
let temp_directory = null;
const original_cwd = process.cwd();

afterEach(async () => {
  process.chdir(original_cwd);

  if (temp_directory) {
    await rm(temp_directory, { force: true, recursive: true });
    temp_directory = null;
  }
});

it('defaults check targets to the current project directory', async () => {
  temp_directory = await mkdtemp(join(tmpdir(), 'patram-check-target-'));
  await writeProjectFile(temp_directory, '.patram.json', '{}\n');
  const project_directory = await realpath(temp_directory);
  process.chdir(temp_directory);

  await expect(resolveCheckTarget(undefined)).resolves.toEqual({
    project_directory,
    target_kind: 'project',
  });
});

it('resolves file and directory targets relative to the project root', async () => {
  temp_directory = await mkdtemp(join(tmpdir(), 'patram-check-target-'));
  await writeProjectFile(temp_directory, '.patram.json', '{}\n');
  await writeProjectFile(
    temp_directory,
    'docs/tasks/example.md',
    '# Example\n',
  );
  const project_directory = await realpath(temp_directory);
  process.chdir(temp_directory);

  await expect(resolveCheckTarget('docs/tasks/example.md')).resolves.toEqual({
    project_directory,
    target_kind: 'file',
    target_path: 'docs/tasks/example.md',
  });
  await expect(resolveCheckTarget('docs')).resolves.toEqual({
    project_directory,
    target_kind: 'directory',
    target_path: 'docs',
  });
});

it('falls back to the target directory when no project config exists above it', async () => {
  temp_directory = await mkdtemp(join(tmpdir(), 'patram-check-target-'));
  await mkdir(join(temp_directory, 'orphan/docs'), { recursive: true });
  const project_directory = await realpath(join(temp_directory, 'orphan/docs'));
  process.chdir(temp_directory);

  await expect(resolveCheckTarget('orphan/docs')).resolves.toEqual({
    project_directory,
    target_kind: 'project',
  });
});

it('filters source files by project, file, and directory targets', () => {
  const source_file_paths = [
    'docs/tasks/example.md',
    'docs/plans/v0/example.md',
    'lib/patram-cli.js',
  ];

  expect(
    selectCheckTargetSourceFiles(source_file_paths, {
      project_directory: '/tmp/project',
      target_kind: 'project',
    }),
  ).toEqual(source_file_paths);
  expect(
    selectCheckTargetSourceFiles(source_file_paths, {
      project_directory: '/tmp/project',
      target_kind: 'file',
      target_path: 'docs/tasks/example.md',
    }),
  ).toEqual(['docs/tasks/example.md']);
  expect(
    selectCheckTargetSourceFiles(source_file_paths, {
      project_directory: '/tmp/project',
      target_kind: 'directory',
      target_path: 'docs',
    }),
  ).toEqual(['docs/tasks/example.md', 'docs/plans/v0/example.md']);
});

it('filters diagnostics by project, file, and directory targets', () => {
  /** @type {$k$$l$load$j$patram$j$config$k$types$k$ts.PatramDiagnostic[]} */
  const diagnostics = [
    createDiagnostic('docs/tasks/example.md', 'Example task diagnostic.'),
    createDiagnostic('docs/plans/v0/example.md', 'Example plan diagnostic.'),
    createDiagnostic('lib/patram-cli.js', 'Example source diagnostic.'),
  ];

  expect(
    selectCheckTargetDiagnostics(diagnostics, {
      project_directory: '/tmp/project',
      target_kind: 'project',
    }),
  ).toEqual(diagnostics);
  expect(
    selectCheckTargetDiagnostics(diagnostics, {
      project_directory: '/tmp/project',
      target_kind: 'file',
      target_path: 'docs/tasks/example.md',
    }),
  ).toEqual([
    createDiagnostic('docs/tasks/example.md', 'Example task diagnostic.'),
  ]);
  expect(
    selectCheckTargetDiagnostics(diagnostics, {
      project_directory: '/tmp/project',
      target_kind: 'directory',
      target_path: 'docs',
    }),
  ).toEqual([
    createDiagnostic('docs/tasks/example.md', 'Example task diagnostic.'),
    createDiagnostic('docs/plans/v0/example.md', 'Example plan diagnostic.'),
  ]);
});

/**
 * @param {string} project_root
 * @param {string} relative_path
 * @param {string} source_text
 */
async function writeProjectFile(project_root, relative_path, source_text) {
  const file_path = join(project_root, relative_path);
  const directory_path = file_path.slice(0, file_path.lastIndexOf('/'));

  await mkdir(directory_path, { recursive: true });
  await writeFile(file_path, source_text);
}

/**
 * @param {string} path
 * @param {string} message
 * @returns {$k$$l$load$j$patram$j$config$k$types$k$ts.PatramDiagnostic}
 */
function createDiagnostic(path, message) {
  return {
    code: 'example',
    column: 1,
    level: 'error',
    line: 1,
    message,
    path,
  };
}
