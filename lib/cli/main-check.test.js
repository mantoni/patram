import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

import { afterEach, expect, it } from 'vitest';

import { main } from './main.js';

const test_context = createTestContext();

afterEach(async () => {
  await cleanupTestContext(test_context);
});

it('renders directive validation diagnostics through the check command', async () => {
  const { exit_code, stderr_text, stdout_chunks } =
    await runPlainCheckForFixture(writeInvalidEnumFixtureProject);

  expect(exit_code).toBe(1);
  expect(stdout_chunks).toEqual([]);
  expect(stderr_text).toContain('document docs/tasks/task.md');
  expect(stderr_text).toContain('directive.invalid_enum');
});

it('reports missing front-matter path targets through the check command', async () => {
  const { exit_code, stderr_text, stdout_chunks } =
    await runPlainCheckForFixture(writeMissingPathFixtureProject);

  expect(exit_code).toBe(1);
  expect(stdout_chunks).toEqual([]);
  expect(stderr_text).toContain('directive.path_not_found');
  expect(stderr_text).toContain('docs/plans/v0/missing.md');
});

it('deduplicates overlapping multi-path check scopes in one run', async () => {
  const { exit_code, stderr_text, stdout_chunks } =
    await runPlainCheckForFixture(writeValidFixtureProject, [
      'docs',
      'docs/tasks/task.md',
    ]);

  expect(exit_code).toBe(0);
  expect(stderr_text).toBe('');
  expect(stdout_chunks).toEqual([
    'Check passed.\nScanned 3 files. Found 0 errors.\n',
  ]);
});

it('fails multi-path checks when paths resolve to different project roots', async () => {
  const { exit_code, stderr_text, stdout_chunks } =
    await runPlainCheckForFixture(writeNestedProjectFixtureProject, [
      'docs/decisions/one.md',
      'nested/docs/tasks/task.md',
    ]);

  expect(exit_code).toBe(1);
  expect(stdout_chunks).toEqual([]);
  expect(stderr_text).toContain(
    'Check paths must resolve to the same project root.',
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
 * @param {{ original_working_directory: string, project_directory: string | null }} current_test_context
 */
async function cleanupTestContext(current_test_context) {
  process.chdir(current_test_context.original_working_directory);

  if (!current_test_context.project_directory) {
    return;
  }

  await rm(current_test_context.project_directory, {
    force: true,
    recursive: true,
  });
  current_test_context.project_directory = null;
}

/**
 * @returns {Promise<string>}
 */
async function createTempProjectDirectory() {
  return mkdtemp(join(tmpdir(), 'patram-cli-'));
}

/**
 * @param {(project_directory: string) => Promise<void>} write_fixture_project
 * @param {string[]} check_arguments
 * @returns {Promise<{ exit_code: number, stderr_text: string, stdout_chunks: string[] }>}
 */
async function runPlainCheckForFixture(
  write_fixture_project,
  check_arguments = [],
) {
  test_context.project_directory = await createTempProjectDirectory();
  process.chdir(test_context.project_directory);
  await write_fixture_project(test_context.project_directory);

  /** @type {string[]} */
  const stderr_chunks = [];
  /** @type {string[]} */
  const stdout_chunks = [];
  const exit_code = await main(['check', ...check_arguments, '--plain'], {
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

  return {
    exit_code,
    stderr_text: stderr_chunks.join(''),
    stdout_chunks,
  };
}

/**
 * @param {string} project_directory
 */
async function writeInvalidEnumFixtureProject(project_directory) {
  await writeProjectFile(
    project_directory,
    '.patram.json',
    createCheckConfigSource(),
  );
  await writeProjectFile(
    project_directory,
    'docs/decisions/one.md',
    '# Decision\n',
  );
  await writeProjectFile(
    project_directory,
    'docs/plans/v0/plan.md',
    '# Plan\n',
  );
  await writeProjectFile(
    project_directory,
    'docs/tasks/task.md',
    ['# Example Task', '', 'status: blocked'].join('\n'),
  );
}

/**
 * @param {string} project_directory
 */
async function writeMissingPathFixtureProject(project_directory) {
  await writeProjectFile(
    project_directory,
    '.patram.json',
    createCheckConfigSource(),
  );
  await writeProjectFile(
    project_directory,
    'docs/decisions/one.md',
    '# Decision\n',
  );
  await writeProjectFile(
    project_directory,
    'docs/tasks/task.md',
    [
      '---',
      'status: pending',
      'decided_by: docs/decisions/one.md',
      'tracked_in: docs/plans/v0/missing.md',
      '---',
      '# Example Task',
    ].join('\n'),
  );
}

/**
 * @param {string} project_directory
 */
async function writeValidFixtureProject(project_directory) {
  await writeProjectFile(
    project_directory,
    '.patram.json',
    createCheckConfigSource(),
  );
  await writeProjectFile(
    project_directory,
    'docs/decisions/one.md',
    '# Decision\n',
  );
  await writeProjectFile(
    project_directory,
    'docs/plans/v0/plan.md',
    '# Plan\n',
  );
  await writeProjectFile(
    project_directory,
    'docs/tasks/task.md',
    [
      '# Example Task',
      '',
      'status: pending',
      'decided_by: ../decisions/one.md',
      'tracked_in: ../plans/v0/plan.md',
    ].join('\n'),
  );
}

/**
 * @param {string} project_directory
 */
async function writeNestedProjectFixtureProject(project_directory) {
  await writeValidFixtureProject(project_directory);
  await writeProjectFile(
    project_directory,
    'nested/.patram.json',
    createCheckConfigSource(),
  );
  await writeProjectFile(
    project_directory,
    'nested/docs/tasks/task.md',
    ['# Nested Task', '', 'status: pending'].join('\n'),
  );
}

/**
 * @param {string} project_directory
 * @param {string} relative_path
 * @param {string} source_text
 */
async function writeProjectFile(project_directory, relative_path, source_text) {
  const file_path = join(project_directory, relative_path);
  const parent_directory = dirname(file_path);

  await mkdir(parent_directory, { recursive: true });
  await writeFile(file_path, source_text);
}

/**
 * @returns {string}
 */
function createCheckConfigSource() {
  return JSON.stringify({
    fields: {
      decided_by: {
        many: true,
        to: 'document',
        type: 'ref',
      },
      status: {
        on: ['task'],
        type: 'enum',
        values: ['accepted', 'pending'],
      },
      tracked_in: {
        many: true,
        to: 'document',
        type: 'ref',
      },
    },
    include: ['docs/**/*.md'],
    queries: {},
    types: {
      decision: {
        in: 'docs/decisions/**/*.md',
      },
      plan: {
        in: 'docs/plans/**/*.md',
      },
      task: {
        in: 'docs/tasks/**/*.md',
      },
    },
  });
}
